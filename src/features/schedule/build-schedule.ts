import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import { getOccurrences, occurrenceKey } from '@/lib/recurrence';
import { getDayBand, type DayBand, type DayBandConfig } from '@/lib/time/day-bands';

export type ScheduleBand = DayBand | 'anytime';

export type ScheduledItem = {
  key: string;
  habit: Habit;
  at: Date;
  hasTime: boolean;
  band: ScheduleBand;
  log?: HabitLog;
};

/** Joins habits' occurrences in [from, to) with their logs, sorted by time. */
export function buildSchedule(
  habits: Habit[],
  logs: HabitLog[],
  from: Date,
  to: Date,
  bands: DayBandConfig,
): ScheduledItem[] {
  const logsByKey = new Map(
    logs.map((log) => [occurrenceKey(log.habit_id, new Date(log.occurrence_at)), log]),
  );

  return habits
    .flatMap((habit) =>
      getOccurrences(habit, from, to).map(({ at, hasTime }): ScheduledItem => {
        const key = occurrenceKey(habit.id, at);
        return {
          key,
          habit,
          at,
          hasTime,
          band: hasTime ? getDayBand(at.getHours(), bands) : 'anytime',
          log: logsByKey.get(key),
        };
      }),
    )
    .sort((a, b) => a.at.getTime() - b.at.getTime() || Number(a.hasTime) - Number(b.hasTime));
}

export function isDone(item: ScheduledItem): boolean {
  return item.log?.status === 'done' || item.log?.status === 'done_minimum';
}
