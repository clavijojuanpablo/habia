import {
  AUTOMATICITY_REPETITIONS,
  type HabitGrowth,
} from "@/features/garden/compute-garden";
import type { ScheduleBand } from "@/features/schedule/build-schedule";
import type {
  BandStat,
  DayStat,
  WeekStat,
} from "@/features/stats/compute-stats";
import { daysBetween } from "@/lib/recurrence";

/**
 * The coach's daily tip: one rule-based nudge, each rule grounded in docs/SCIENCE.md.
 * The engine only picks the rule and its numbers; the words live in i18n (`coach.*`).
 */
export type CoachTip =
  | {
      rule: "never_miss_twice";
      habitId: string;
      name: string;
      minimum: string | null;
    }
  | { rule: "comeback" }
  | {
      rule: "automaticity";
      habitId: string;
      name: string;
      completions: number;
      stage: "half" | "close" | "fruit";
    }
  | {
      rule: "add_minimum" | "add_intention";
      habitId: string;
      name: string;
      percent: number;
    }
  | {
      rule: "best_band";
      best: ScheduleBand;
      worst: ScheduleBand;
      bestPercent: number;
      worstPercent: number;
    }
  | { rule: "week_up"; thisWeek: number; lastWeek: number }
  | { rule: "fact"; index: number };

export type CoachInput = {
  growth: HabitGrowth[];
  /** Oldest → newest, today last (see `computeStats`). */
  days: DayStat[];
  bands: BandStat[];
  weeks: WeekStat[];
  /** Habits with an occurrence still pending today. */
  pendingToday: string[];
  today: Date;
};

export const FACT_COUNT = 8;

/** Below this, a habit "struggles" and gets a friction-reducing suggestion. */
const STRUGGLING_CONSISTENCY = 0.5;
/** Enough due occurrences in 30 days for a consistency ratio to mean something. */
const MIN_RECENT_DUE = 7;
const MIN_BAND_DUE = 5;
const BAND_GAP = 0.25;
const MIN_WEEK_DUE = 5;
/** In percentage points, as the user reads them (also dodges 0.8 - 0.7 = 0.1000…01). */
const WEEK_GAIN_POINTS = 10;

const percent = (ratio: number) => Math.round(ratio * 100);

/** First matching rule wins; the order is the priority. Returns null without habits. */
export function computeTip(input: CoachInput): CoachTip | null {
  if (input.growth.length === 0) return null;
  return (
    neverMissTwice(input) ??
    comeback(input) ??
    automaticity(input) ??
    struggling(input) ??
    bestBand(input) ??
    weekUp(input) ??
    fact(input.today)
  );
}

/** Fallback: a science fact, the same all day, a different one each day. */
function fact(today: Date): CoachTip {
  const dayOfYear = daysBetween(new Date(today.getFullYear(), 0, 1), today);
  return { rule: "fact", index: dayOfYear % FACT_COUNT };
}

/** Exactly one miss and today's occurrence still open: one miss is an accident, two a pattern. */
function neverMissTwice({ growth, pendingToday }: CoachInput): CoachTip | null {
  const g = growth.find(
    (g) => g.trailingMisses === 1 && pendingToday.includes(g.habit.id),
  );
  return g
    ? {
        rule: "never_miss_twice",
        habitId: g.habit.id,
        name: g.habit.name,
        minimum: g.habit.two_minute_version,
      }
    : null;
}

/** Two missed days in a row and nothing yet today: avoid "I already ruined it, so why bother". */
function comeback({ days }: CoachInput): CoachTip | null {
  const past = days.slice(0, -1).filter((d) => d.due > 0);
  const today = days[days.length - 1];
  const [before, last] = past.slice(-2);
  const hadMomentum = past.slice(0, -2).some((d) => d.done > 0);
  if (
    !before ||
    !last ||
    before.done > 0 ||
    last.done > 0 ||
    !hadMomentum ||
    (today?.done ?? 0) > 0
  )
    return null;
  return { rule: "comeback" };
}

/** Honest journey to ~66 repetitions (Lally et al., 2010): halfway, close, and the fruit. */
function automaticity({ growth }: CoachInput): CoachTip | null {
  const half = AUTOMATICITY_REPETITIONS / 2;
  for (const g of growth) {
    const n = g.completions;
    const stage =
      n >= AUTOMATICITY_REPETITIONS && n < AUTOMATICITY_REPETITIONS + 3
        ? "fruit"
        : n >= AUTOMATICITY_REPETITIONS - 5 && n < AUTOMATICITY_REPETITIONS
          ? "close"
          : n >= half && n < half + 3
            ? "half"
            : null;
    if (stage)
      return {
        rule: "automaticity",
        habitId: g.habit.id,
        name: g.habit.name,
        completions: n,
        stage,
      };
  }
  return null;
}

/** A habit that keeps slipping gets less friction (2-minute rule) or a clearer cue (implementation intention). */
function struggling({ growth }: CoachInput): CoachTip | null {
  const candidates = growth
    .filter(
      (g) =>
        g.recentDue >= MIN_RECENT_DUE && g.consistency < STRUGGLING_CONSISTENCY,
    )
    .sort((a, b) => a.consistency - b.consistency);
  for (const g of candidates) {
    const base = {
      habitId: g.habit.id,
      name: g.habit.name,
      percent: percent(g.consistency),
    };
    if (!g.habit.two_minute_version) return { rule: "add_minimum", ...base };
    if (!g.habit.implementation_intention)
      return { rule: "add_intention", ...base };
  }
  return null;
}

/** Shows *when* the user succeeds, so they can place habits where their energy is. */
function bestBand({ bands }: CoachInput): CoachTip | null {
  const measured = bands.filter(
    (b) => b.due >= MIN_BAND_DUE && b.ratio !== null,
  );
  if (measured.length < 2) return null;
  const sorted = [...measured].sort((a, b) => (b.ratio ?? 0) - (a.ratio ?? 0));
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];
  if ((best.ratio ?? 0) - (worst.ratio ?? 0) < BAND_GAP) return null;
  return {
    rule: "best_band",
    best: best.band,
    worst: worst.band,
    bestPercent: percent(best.ratio ?? 0),
    worstPercent: percent(worst.ratio ?? 0),
  };
}

/** Small gains compound (the 1% rule): name the improvement when it happens. */
function weekUp({ weeks }: CoachInput): CoachTip | null {
  const current = weeks[weeks.length - 1];
  const previous = weeks[weeks.length - 2];
  if (
    !current ||
    !previous ||
    current.ratio === null ||
    previous.ratio === null
  )
    return null;
  if (current.due < MIN_WEEK_DUE || previous.due < MIN_WEEK_DUE) return null;
  const thisWeek = percent(current.ratio);
  const lastWeek = percent(previous.ratio);
  return thisWeek - lastWeek >= WEEK_GAIN_POINTS
    ? { rule: "week_up", thisWeek, lastWeek }
    : null;
}
