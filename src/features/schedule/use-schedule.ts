import { useMemo } from 'react';

import { useLogs, useToggleLog, type LogStatus } from '@/features/checkins/api';
import { canLog } from '@/features/checkins/rules';
import { useHabits } from '@/features/habits/api';
import { useDayBands } from '@/features/profile/api';
import { track } from '@/lib/analytics';
import { hapticLight, hapticSuccess } from '@/lib/haptics';

import { buildSchedule, isDone, type ScheduledItem } from './build-schedule';

/** Habits' occurrences in [from, to) joined with their logs. */
export function useSchedule(from: Date, to: Date) {
  const habits = useHabits();
  const logs = useLogs(from, to);
  const bands = useDayBands();
  const toggle = useToggleLog();

  const items = useMemo(
    () => buildSchedule(habits.data ?? [], logs.data ?? [], from, to, bands),
    [habits.data, logs.data, from, to, bands],
  );

  const toggleItem = (item: ScheduledItem, status: LogStatus = 'done') => {
    // A day that has not arrived cannot be completed.
    if (!canLog(item.at, new Date())) return;
    // Skipping toggles independently of done/done_minimum: re-picking it undoes it.
    const undo = status === 'skipped' ? item.log?.status === 'skipped' : isDone(item);
    if (undo) hapticLight();
    else hapticSuccess();
    toggle.mutate({
      habitId: item.habit.id,
      at: item.at.toISOString(),
      existing: undo ? item.log : undefined,
      status,
      circleHabitId: item.habit.circle_habit_id,
    });
    if (!undo) track('checkin_logged', { status, band: item.band });
  };

  return {
    items,
    bands,
    hasHabits: (habits.data?.length ?? 0) > 0,
    isLoading: habits.isLoading || logs.isLoading,
    /**
     * Both habits and logs are actually here. Not the same as `!isLoading`: while the persisted
     * cache restores, or after a failed fetch, nothing is loading and there is still no data.
     */
    isReady: !!habits.data && !!logs.data,
    error: habits.error ?? logs.error,
    toggleItem,
  };
}
