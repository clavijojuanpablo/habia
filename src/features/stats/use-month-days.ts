import { useMemo } from 'react';

import { useLogs } from '@/features/checkins/api';
import { GARDEN_WINDOW_DAYS } from '@/features/garden/compute-garden';
import { useHabits } from '@/features/habits/api';
import { useDayBands } from '@/features/profile/api';
import { addDays } from '@/lib/recurrence';

import { monthDays } from './compute-stats';

/**
 * The heatmap's month. A month inside the stats window reads the same cached logs as the
 * rest of Progress (no extra request); an older month fetches its own, so any month since
 * joining can be browsed.
 */
export function useMonthDays(month: Date, today: Date) {
  const { from, to } = useMemo(() => {
    const windowFrom = addDays(today, -GARDEN_WINDOW_DAYS);
    const tomorrow = addDays(today, 1);
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    if (first >= windowFrom) return { from: windowFrom, to: tomorrow };
    const next = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    return { from: first, to: next < tomorrow ? next : tomorrow };
  }, [month, today]);
  const habits = useHabits();
  const logs = useLogs(from, to);
  const bands = useDayBands();

  const days = useMemo(
    () => monthDays(habits.data ?? [], logs.data ?? [], month, today, bands),
    [habits.data, logs.data, month, today, bands],
  );
  return { days, isLoading: habits.isLoading || logs.isLoading, error: habits.error ?? logs.error };
}
