import { useMemo } from 'react';

import { useStats } from '@/features/stats/use-stats';

import { computeStreak } from './compute-streak';

/** App-wide day streak, derived from the same cached logs as Progress and Garden. */
export function useStreak(today: Date) {
  const { stats, isLoading } = useStats(today);
  const streak = useMemo(() => computeStreak(stats.days, today), [stats.days, today]);
  return { streak, isLoading };
}
