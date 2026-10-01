import type { HabitLog } from '@/features/checkins/api';
import { GARDEN_WINDOW_DAYS } from '@/features/garden/compute-garden';
import type { Habit } from '@/features/habits/api';
import { addDays, getOccurrences, occurrenceKey } from '@/lib/recurrence';

export type PastOccurrence = {
  at: Date;
  done: boolean;
  /** Done through the 2-minute version. */
  minimum: boolean;
  /** A rest day on purpose: neither a miss nor a completion. */
  skipped: boolean;
  /** When the check-in was actually tapped (null when not logged). */
  loggedAt: Date | null;
};

export type HabitHistory = { habit: Habit; occurrences: PastOccurrence[] };

/**
 * Each habit's settled occurrences over the garden window, oldest first: every past
 * occurrence, plus today's only once done (a pending habit today is not a miss yet).
 * Same window as the garden, so it reads the same cached logs.
 */
export function buildHistory(habits: Habit[], logs: HabitLog[], today: Date): HabitHistory[] {
  const logsByKey = new Map(logs.map((log) => [occurrenceKey(log.habit_id, new Date(log.occurrence_at)), log]));
  const from = addDays(today, -GARDEN_WINDOW_DAYS);

  return habits.map((habit) => ({
    habit,
    occurrences: getOccurrences(habit, from, addDays(today, 1))
      .map(({ at }): PastOccurrence => {
        const log = logsByKey.get(occurrenceKey(habit.id, at));
        return {
          at,
          done: log?.status === 'done' || log?.status === 'done_minimum',
          minimum: log?.status === 'done_minimum',
          skipped: log?.status === 'skipped',
          loggedAt: log ? new Date(log.logged_at) : null,
        };
      })
      .filter((o) => o.at < today || o.done),
  }));
}
