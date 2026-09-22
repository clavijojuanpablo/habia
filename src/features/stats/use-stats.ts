import { useMemo } from 'react';

import { useLogs } from '@/features/checkins/api';
import { GARDEN_WINDOW_DAYS } from '@/features/garden/compute-garden';
import { useHabits } from '@/features/habits/api';
import { useDayBands } from '@/features/profile/api';
import { addDays } from '@/lib/recurrence';

import { computeStats } from './compute-stats';

/**
 * Uses the same logs range as the garden, so TanStack Query serves both screens
 * from one cached request.
 */
export function useStats(today: Date) {
  const from = useMemo(() => addDays(today, -GARDEN_WINDOW_DAYS), [today]);
  const to = useMemo(() => addDays(today, 1), [today]);

  const habits = useHabits();
  const logs = useLogs(from, to);
  const bands = useDayBands();

  const stats = useMemo(
    () => computeStats(habits.data ?? [], logs.data ?? [], from, today, bands),
    [habits.data, logs.data, from, today, bands],
  );

  return { stats, isLoading: habits.isLoading || logs.isLoading, error: habits.error ?? logs.error };
}
