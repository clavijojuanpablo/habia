import { useMemo } from 'react';

import { useLogs } from '@/features/checkins/api';
import { GARDEN_WINDOW_DAYS, type HabitGrowth } from '@/features/garden/compute-garden';
import { useHabits } from '@/features/habits/api';
import { buildHistory } from '@/lib/history';
import { addDays } from '@/lib/recurrence';

import { computeHighlights } from './highlights';

/** Progress highlights from the garden's numbers (passed in) and the same cached 120-day logs. */
export function useHighlights(today: Date, growth: HabitGrowth[]) {
  const habits = useHabits();
  const from = useMemo(() => addDays(today, -GARDEN_WINDOW_DAYS), [today]);
  const to = useMemo(() => addDays(today, 1), [today]);
  const logs = useLogs(from, to);
  return useMemo(
    () =>
      computeHighlights(growth, buildHistory(habits.data ?? [], logs.data ?? [], today, GARDEN_WINDOW_DAYS), today),
    [growth, habits.data, logs.data, today],
  );
}
