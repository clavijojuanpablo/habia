import { addDays, daysBetween, formatLocalDate, startOfWeek } from '@/lib/recurrence';

/** One person's day as the server shares it (`social_days`): planted something, rested on purpose, or both. */
export type DayMark = { user_id: string; day: string; active: boolean; skipped: boolean };

export type SharedDayState = 'both' | 'one' | 'none' | 'rest' | 'pending' | 'future';

export type SharedStreak = {
  current: number;
  /** The run reaches back to the first day the server shares (60 days): show it as "60+". */
  capped: boolean;
  /** Monday → Sunday of the current week. */
  week: { date: Date; state: SharedDayState }[];
};

/** How many days back friends' days are fetched (the server caps it at 60). */
export const SHARED_WINDOW_DAYS = 60;

const byDay = (marks: DayMark[]) => new Map(marks.map((m) => [m.day, m]));

/**
 * The streak two friends grow together, with the app's forgiveness: it grows on days both planted;
 * a day only one (or neither) planted is a wait that neither grows nor breaks it; two such days in a
 * row reset it. A rest on purpose from either is neutral. Today stays pending until both planted.
 */
export function computeSharedStreak(mine: DayMark[], theirs: DayMark[], today: Date): SharedStreak {
  const a = byDay(mine);
  const b = byDay(theirs);
  const first = addDays(today, -SHARED_WINDOW_DAYS);
  const states = new Map<string, SharedDayState>();
  let run = 0;
  let misses = 0;
  let startedOn: Date | null = null;

  for (let date = first; daysBetween(date, today) >= 0; date = addDays(date, 1)) {
    const key = formatLocalDate(date);
    const x = a.get(key);
    const y = b.get(key);
    const planted = (x?.active ? 1 : 0) + (y?.active ? 1 : 0);
    if (planted === 2) {
      if (run === 0) startedOn = date;
      run++;
      misses = 0;
      states.set(key, 'both');
    } else if (daysBetween(date, today) === 0) {
      states.set(key, 'pending');
    } else if (x?.skipped || y?.skipped) {
      states.set(key, 'rest');
    } else {
      states.set(key, planted === 1 ? 'one' : 'none');
      if (++misses >= 2) {
        run = 0;
        startedOn = null;
      }
    }
  }

  const monday = startOfWeek(today);
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const state: SharedDayState = date > today ? 'future' : (states.get(formatLocalDate(date)) ?? 'none');
    return { date, state };
  });

  return {
    current: run,
    capped: run > 0 && startedOn !== null && daysBetween(startedOn, first) === 0,
    week,
  };
}

export type CircleWeekRow = { userId: string; days: ('active' | 'rest' | 'empty' | 'future')[] };

/**
 * A circle's week: one row of seven days per member, and how many days so far everyone planted.
 * Circles have no group streak on purpose — with eight people it would break all the time.
 */
export function computeCircleWeek(memberIds: string[], marks: DayMark[], today: Date) {
  const seen = new Map(marks.map((m) => [`${m.user_id}:${m.day}`, m]));
  const monday = startOfWeek(today);
  const dates = Array.from({ length: 7 }, (_, i) => addDays(monday, i));

  const rows: CircleWeekRow[] = memberIds.map((userId) => ({
    userId,
    days: dates.map((date) => {
      if (date > today) return 'future';
      const mark = seen.get(`${userId}:${formatLocalDate(date)}`);
      return mark?.active ? 'active' : mark?.skipped ? 'rest' : 'empty';
    }),
  }));

  const allPlanted =
    memberIds.length === 0 ? 0 : dates.filter((_, i) => rows.every((row) => row.days[i] === 'active')).length;
  return { rows, allPlanted };
}
