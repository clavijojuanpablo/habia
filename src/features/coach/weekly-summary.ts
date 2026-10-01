import { addDays, formatLocalDate, getOccurrences, occurrenceKey, startOfWeek } from '@/lib/recurrence';

/**
 * The numbers behind the AI weekly review, computed in code so Claude only narrates
 * them (it never counts or invents). Pure: runs in the app's tests and, synced into
 * `supabase/functions/_shared/`, inside the `weekly-review` Edge Function.
 * All dates are local (floating) dates; see `src/lib/time/zoned.ts`.
 */

export type SummaryHabit = {
  id: string;
  name: string;
  rrule: string;
  starts_on: string;
  window_start: string | null;
  window_end: string | null;
  two_minute_version: string | null;
  implementation_intention: string | null;
  identity: string | null;
};

export type SummaryLog = {
  habit_id: string;
  /** Local (floating) time of the occurrence the log answers. */
  occurrence_at: Date;
  status: 'done' | 'done_minimum' | 'skipped' | 'missed';
};

type Tally = { due: number; done: number; minimum: number; rest: number };

export type HabitWeek = Tally & {
  name: string;
  identity: string | null;
  /** Done / due this week, 0–100; null when nothing was due. */
  percent: number | null;
  /** Same for the week before, to compare. */
  previousPercent: number | null;
  /** Weekdays (0 = Monday) with an occurrence that was due and not done. */
  missedWeekdays: number[];
  hasMinimumVersion: boolean;
  where: string | null;
};

export type WeeklySummary = {
  /** Monday of the reviewed week, YYYY-MM-DD. */
  weekStart: string;
  weekEnd: string;
  total: Tally & { percent: number | null; previousPercent: number | null };
  /** Done per weekday (0 = Monday), to spot the strongest and weakest days. */
  doneByWeekday: number[];
  habits: HabitWeek[];
};

const percent = (t: Tally) => (t.due === 0 ? null : Math.round((t.done / t.due) * 100));
const empty = (): Tally => ({ due: 0, done: 0, minimum: 0, rest: 0 });

/** Monday of the last fully finished week, seen from `today` (a local date). */
export function lastWeekStart(today: Date): Date {
  return addDays(startOfWeek(today), -7);
}

/**
 * Tallies one week (Monday → Sunday starting at `weekStart`) and the week before.
 * A rest day on purpose is neither due nor missed, same as in the app's stats.
 */
export function summarizeWeek(habits: SummaryHabit[], logs: SummaryLog[], weekStart: Date): WeeklySummary {
  const logsByKey = new Map(logs.map((log) => [occurrenceKey(log.habit_id, log.occurrence_at), log]));
  const weekEnd = addDays(weekStart, 7);
  const previousStart = addDays(weekStart, -7);
  const total = empty();
  const previousTotal = empty();
  const doneByWeekday = [0, 0, 0, 0, 0, 0, 0];

  const tally = (habit: SummaryHabit, from: Date, to: Date, onDone?: (weekday: number) => void) => {
    const t = empty();
    const missed: number[] = [];
    for (const { at } of getOccurrences(habit, from, to)) {
      const status = logsByKey.get(occurrenceKey(habit.id, at))?.status;
      const weekday = (at.getDay() + 6) % 7;
      if (status === 'skipped') {
        t.rest++;
        continue;
      }
      t.due++;
      if (status === 'done' || status === 'done_minimum') {
        t.done++;
        if (status === 'done_minimum') t.minimum++;
        onDone?.(weekday);
      } else if (!missed.includes(weekday)) {
        missed.push(weekday);
      }
    }
    return { t, missed };
  };

  const habitWeeks = habits.map((habit): HabitWeek => {
    const current = tally(habit, weekStart, weekEnd, (weekday) => doneByWeekday[weekday]++);
    const previous = tally(habit, previousStart, weekStart);
    for (const key of ['due', 'done', 'minimum', 'rest'] as const) {
      total[key] += current.t[key];
      previousTotal[key] += previous.t[key];
    }
    return {
      ...current.t,
      name: habit.name,
      identity: habit.identity,
      percent: percent(current.t),
      previousPercent: percent(previous.t),
      missedWeekdays: current.missed.sort((a, b) => a - b),
      hasMinimumVersion: !!habit.two_minute_version,
      where: habit.implementation_intention,
    };
  });

  return {
    weekStart: formatLocalDate(weekStart),
    weekEnd: formatLocalDate(addDays(weekStart, 6)),
    total: { ...total, percent: percent(total), previousPercent: percent(previousTotal) },
    doneByWeekday,
    // Only habits that had something due this week say anything about it.
    habits: habitWeeks.filter((h) => h.due > 0),
  };
}
