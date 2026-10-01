import { AUTOMATICITY_REPETITIONS } from '@/features/garden/compute-garden';
import { addDays, daysBetween, formatLocalDate } from '@/lib/recurrence';
import { DAY_BANDS, getDayBand, type DayBand } from '@/lib/time/day-bands';

import type { PastOccurrence } from './history';
import type { Candidate, CoachInput, TipBody } from './types';

/**
 * Each detector looks at one pattern in the user's own data and proposes candidates
 * with a base score (higher = more urgent or more valuable). Every one stays silent
 * below its minimum sample: no "you fail on Fridays" from two Fridays.
 */
export type Detector = (input: CoachInput) => Candidate[];

export const SCORES = {
  never_miss_twice: 100,
  comeback: 90,
  usual_time: 80,
  weak_weekday: 70,
  automaticity: 65,
  struggling: 60,
  week_up: 55,
  projection: 50,
  agenda: 45,
  best_band: 40,
  minimum_saved: 35,
  fact: 10,
} as const;

export const FACT_COUNT = 8;

const STRUGGLING_CONSISTENCY = 0.5;
/** Enough due occurrences in 30 days for a consistency ratio to mean something. */
const MIN_RECENT_DUE = 7;
const MIN_BAND_DUE = 5;
const BAND_GAP = 0.25;
const MIN_WEEK_DUE = 5;
/** In percentage points, as the user reads them (also dodges 0.8 - 0.7 = 0.1000…01). */
const WEEK_GAIN_POINTS = 10;
const MIN_TIMED_CHECKINS = 5;
const LATE_AFTER_MINUTES = 60;
const MIN_WEEKDAY_SAMPLE = 4;
const WEAK_WEEKDAY_MAX = 0.5;
const WEAK_WEEKDAY_GAP_POINTS = 30;
const PROJECTION_MIN_COMPLETIONS = 10;
const PROJECTION_PACE_DAYS = 28;
const PROJECTION_MAX_DAYS = 60;
const AGENDA_MIN_TOTAL = 4;
const AGENDA_MIN_IN_WEAK_BAND = 2;
const MIN_MINIMUMS = 3;
const MIN_STREAK_FOR_MINIMUMS = 3;

const percent = (ratio: number) => Math.round(ratio * 100);
const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
const counted = (o: PastOccurrence) => !o.skipped;
const rate = (list: PastOccurrence[]) => (list.length ? list.filter((o) => o.done).length / list.length : 0);
const candidate = (body: TipBody, score: number, habitId?: string): Candidate => ({
  body,
  score,
  key: habitId ? `${body.rule}:${habitId}` : body.rule,
});
const pendingIds = ({ agenda }: CoachInput) => new Set(agenda.filter((a) => a.pending).map((a) => a.habitId));
const historyOf = ({ history }: CoachInput, habitId: string) =>
  history.find((h) => h.habit.id === habitId)?.occurrences.filter(counted) ?? [];

/**
 * Most recent run of "missed once, then came back": how many single misses in a row
 * were followed by a completion. The current, unresolved miss does not count.
 */
export function countComebacks(occurrences: PastOccurrence[]): number {
  const runs: number[] = [];
  let misses = 0;
  let seenDone = false;
  for (const o of occurrences) {
    if (o.done) {
      if (seenDone && misses > 0) runs.push(misses);
      misses = 0;
      seenDone = true;
    } else if (seenDone) {
      misses++;
    }
  }
  let count = 0;
  for (let i = runs.length - 1; i >= 0 && runs[i] === 1; i--) count++;
  return count;
}

/** Exactly one miss and today's occurrence still open: one miss is an accident, two a pattern. */
const neverMissTwice: Detector = (input) => {
  const pending = pendingIds(input);
  return input.growth
    .filter((g) => g.trailingMisses === 1 && pending.has(g.habit.id))
    .map((g) =>
      candidate(
        {
          rule: 'never_miss_twice',
          habitId: g.habit.id,
          name: g.habit.name,
          minimum: g.habit.two_minute_version,
          comebacks: countComebacks(historyOf(input, g.habit.id)),
        },
        SCORES.never_miss_twice,
        g.habit.id,
      ),
    );
};

/** Two missed days in a row and nothing yet today: avoid "I already ruined it, so why bother". */
const comeback: Detector = ({ days }) => {
  const past = days.slice(0, -1).filter((d) => d.due > 0);
  const today = days[days.length - 1];
  const [before, last] = past.slice(-2);
  const hadMomentum = past.slice(0, -2).some((d) => d.done > 0);
  if (!before || !last || before.done > 0 || last.done > 0 || !hadMomentum || (today?.done ?? 0) > 0) return [];
  return [candidate({ rule: 'comeback' }, SCORES.comeback)];
};

/** Habits form faster at a stable time: notice when today's check-in runs late against the user's own habit. */
const usualTime: Detector = (input) => {
  const pending = pendingIds(input);
  const now = minutesOfDay(input.now);
  return input.history.flatMap(({ habit, occurrences }) => {
    if (!pending.has(habit.id)) return [];
    // Only same-day check-ins: a late catch-up says nothing about the usual time.
    const times = occurrences
      .filter((o) => o.done && o.loggedAt && daysBetween(o.at, o.loggedAt) === 0)
      .map((o) => minutesOfDay(o.loggedAt!))
      .sort((a, b) => a - b);
    if (times.length < MIN_TIMED_CHECKINS) return [];
    const median = times[Math.floor(times.length / 2)];
    if (now - median < LATE_AFTER_MINUTES) return [];
    return [
      candidate(
        { rule: 'usual_time', habitId: habit.id, name: habit.name, minutes: median, sample: times.length },
        SCORES.usual_time,
        habit.id,
      ),
    ];
  });
};

/** Today is a weekday on which this habit usually slips: lower the bar before it happens. */
const weakWeekday: Detector = (input) => {
  const pending = pendingIds(input);
  const weekday = input.today.getDay();
  return input.history.flatMap(({ habit, occurrences }) => {
    if (!pending.has(habit.id)) return [];
    const past = occurrences.filter((o) => counted(o) && o.at < input.today);
    const sameDay = past.filter((o) => o.at.getDay() === weekday);
    if (sameDay.length < MIN_WEEKDAY_SAMPLE) return [];
    const dayRate = rate(sameDay);
    const average = rate(past);
    if (dayRate > WEAK_WEEKDAY_MAX || percent(average) - percent(dayRate) < WEAK_WEEKDAY_GAP_POINTS) return [];
    return [
      candidate(
        {
          rule: 'weak_weekday',
          habitId: habit.id,
          name: habit.name,
          minimum: habit.two_minute_version,
          weekdayPercent: percent(dayRate),
          averagePercent: percent(average),
          sample: sameDay.length,
        },
        SCORES.weak_weekday,
        habit.id,
      ),
    ];
  });
};

/** Honest journey to ~66 repetitions (Lally et al., 2010): halfway, close, and the fruit. */
const automaticity: Detector = ({ growth }) => {
  const half = AUTOMATICITY_REPETITIONS / 2;
  return growth.flatMap((g) => {
    const n = g.completions;
    const stage =
      n >= AUTOMATICITY_REPETITIONS && n < AUTOMATICITY_REPETITIONS + 3
        ? 'fruit'
        : n >= AUTOMATICITY_REPETITIONS - 5 && n < AUTOMATICITY_REPETITIONS
          ? 'close'
          : n >= half && n < half + 3
            ? 'half'
            : null;
    if (!stage) return [];
    return [
      candidate(
        { rule: 'automaticity', habitId: g.habit.id, name: g.habit.name, completions: n, stage },
        SCORES.automaticity,
        g.habit.id,
      ),
    ];
  });
};

/** A habit that keeps slipping gets less friction (2-minute rule) or a clearer cue (implementation intention). */
const struggling: Detector = ({ growth }) =>
  growth
    .filter((g) => g.recentDue >= MIN_RECENT_DUE && g.consistency < STRUGGLING_CONSISTENCY)
    .flatMap((g) => {
      const base = { habitId: g.habit.id, name: g.habit.name, percent: percent(g.consistency), sample: g.recentDue };
      // The weaker the habit, the more it needs the nudge.
      const score = SCORES.struggling + (STRUGGLING_CONSISTENCY - g.consistency) * 10;
      if (!g.habit.two_minute_version) return [candidate({ rule: 'add_minimum', ...base }, score, g.habit.id)];
      if (!g.habit.implementation_intention) return [candidate({ rule: 'add_intention', ...base }, score, g.habit.id)];
      return [];
    });

/** Small gains compound (the 1% rule): name the improvement when it happens. */
const weekUp: Detector = ({ weeks }) => {
  const current = weeks[weeks.length - 1];
  const previous = weeks[weeks.length - 2];
  if (!current || !previous || current.ratio === null || previous.ratio === null) return [];
  if (current.due < MIN_WEEK_DUE || previous.due < MIN_WEEK_DUE) return [];
  const thisWeek = percent(current.ratio);
  const lastWeek = percent(previous.ratio);
  if (thisWeek - lastWeek < WEEK_GAIN_POINTS) return [];
  return [candidate({ rule: 'week_up', thisWeek, lastWeek }, SCORES.week_up)];
};

/** A concrete date for the fruit, from the user's own recent pace: progress you can picture. */
const projection: Detector = (input) =>
  input.growth.flatMap((g) => {
    if (g.completions < PROJECTION_MIN_COMPLETIONS || g.completions >= AUTOMATICITY_REPETITIONS) return [];
    const since = addDays(input.today, -PROJECTION_PACE_DAYS);
    const recent = historyOf(input, g.habit.id).filter((o) => o.done && o.at >= since).length;
    if (recent === 0) return [];
    const daysLeft = Math.ceil((AUTOMATICITY_REPETITIONS - g.completions) / (recent / PROJECTION_PACE_DAYS));
    if (daysLeft > PROJECTION_MAX_DAYS) return [];
    return [
      candidate(
        {
          rule: 'projection',
          habitId: g.habit.id,
          name: g.habit.name,
          completions: g.completions,
          recent,
          eta: formatLocalDate(addDays(input.today, daysLeft)),
        },
        // The closer the fruit, the more motivating the date.
        SCORES.projection + (PROJECTION_MAX_DAYS - daysLeft) / 10,
        g.habit.id,
      ),
    ];
  });

/** A heavy day with several habits in the user's weakest band, while there is still time to front-load. */
const agenda: Detector = ({ agenda, bands, bandConfig, now }) => {
  if (agenda.length < AGENDA_MIN_TOTAL) return [];
  const weakest = bands
    .filter((b): b is typeof b & { band: DayBand } => DAY_BANDS.includes(b.band as DayBand))
    .filter((b) => b.due >= MIN_BAND_DUE && b.ratio !== null)
    .sort((a, b) => (a.ratio ?? 0) - (b.ratio ?? 0))[0];
  if (!weakest) return [];
  const inWeak = agenda.filter((a) => a.pending && a.band === weakest.band).length;
  const current = getDayBand(now.getHours(), bandConfig);
  if (inWeak < AGENDA_MIN_IN_WEAK_BAND || DAY_BANDS.indexOf(current) >= DAY_BANDS.indexOf(weakest.band)) return [];
  return [
    candidate(
      {
        rule: 'agenda',
        total: agenda.length,
        band: weakest.band,
        count: inWeak,
        percent: percent(weakest.ratio ?? 0),
      },
      SCORES.agenda,
    ),
  ];
};

/** Shows *when* the user succeeds, so they can place habits where their energy is. */
const bestBand: Detector = ({ bands }) => {
  const measured = bands.filter((b) => b.due >= MIN_BAND_DUE && b.ratio !== null);
  if (measured.length < 2) return [];
  const sorted = [...measured].sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if ((best.ratio ?? 0) - (worst.ratio ?? 0) < BAND_GAP) return [];
  return [
    candidate(
      {
        rule: 'best_band',
        best: best.band,
        worst: worst.band,
        bestPercent: percent(best.ratio ?? 0),
        worstPercent: percent(worst.ratio ?? 0),
      },
      SCORES.best_band,
    ),
  ];
};

/** The 2-minute version doing its job: it kept the streak alive on hard days. */
const minimumSaved: Detector = (input) => {
  const since = addDays(input.today, -30);
  return input.growth.flatMap((g) => {
    if (g.trailingMisses > 0 || g.streak < MIN_STREAK_FOR_MINIMUMS) return [];
    const count = historyOf(input, g.habit.id).filter((o) => o.minimum && o.at >= since).length;
    if (count < MIN_MINIMUMS) return [];
    return [
      candidate(
        { rule: 'minimum_saved', habitId: g.habit.id, name: g.habit.name, count, streak: g.streak },
        SCORES.minimum_saved,
        g.habit.id,
      ),
    ];
  });
};

/** Fallback: a science fact, the same all day, a different one each day. */
const fact: Detector = ({ today }) => {
  const dayOfYear = daysBetween(new Date(today.getFullYear(), 0, 1), today);
  return [candidate({ rule: 'fact', index: dayOfYear % FACT_COUNT }, SCORES.fact)];
};

export const DETECTORS: Detector[] = [
  neverMissTwice,
  comeback,
  usualTime,
  weakWeekday,
  automaticity,
  struggling,
  weekUp,
  projection,
  agenda,
  bestBand,
  minimumSaved,
  fact,
];
