import { addDays, getOccurrences, occurrenceKey } from '@/lib/recurrence';
import type { Tables } from '@/lib/supabase/client';

type Habit = Tables<'habits'>;
type HabitLog = Tables<'habit_logs'>;

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
 * Each habit's settled occurrences over the last `windowDays`, oldest first: every past
 * occurrence, plus today's only once done (a pending habit today is not a miss yet).
 * Shared by the coach and the Progress highlights; pass the garden window to reuse its cached logs.
 */
export function buildHistory(habits: Habit[], logs: HabitLog[], today: Date, windowDays: number): HabitHistory[] {
  const logsByKey = new Map(logs.map((log) => [occurrenceKey(log.habit_id, new Date(log.occurrence_at)), log]));
  const from = addDays(today, -windowDays);

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
