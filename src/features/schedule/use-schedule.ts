import { useMemo } from 'react';

import { useLogs, useToggleLog } from '@/features/checkins/api';
import { canLog } from '@/features/checkins/rules';
import { useHabits } from '@/features/habits/api';
import { useDayBands } from '@/features/profile/api';
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

  const toggleItem = (item: ScheduledItem, status: 'done' | 'done_minimum' = 'done') => {
    // A day that has not arrived cannot be completed.
    if (!canLog(item.at, new Date())) return;
    const done = isDone(item);
    if (done) hapticLight();
    else hapticSuccess();
    toggle.mutate({ habitId: item.habit.id, at: item.at.toISOString(), existing: done ? item.log : undefined, status });
  };

  return {
    items,
    bands,
    hasHabits: (habits.data?.length ?? 0) > 0,
    isLoading: habits.isLoading || logs.isLoading,
    error: habits.error ?? logs.error,
    toggleItem,
  };
}
