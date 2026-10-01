import { useEffect, useMemo } from 'react';

import { useProfile, useUpdateProfile } from '@/features/profile/api';
import { useStats } from '@/features/stats/use-stats';

import { computeStreak } from './compute-streak';

/**
 * App-wide day streak, derived from the same cached logs as Progress and Garden. The record is
 * the larger of the computed one and `profiles.best_streak`, which is raised when beaten: the
 * logs only cover ~4 months, so an older record would otherwise fade.
 */
export function useStreak(today: Date) {
  const { stats, isLoading } = useStats(today);
  const { data: profile } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();
  const computed = useMemo(() => computeStreak(stats.days, today), [stats.days, today]);
  const stored = profile?.best_streak ?? 0;

  useEffect(() => {
    if (profile && !isLoading && computed.record > stored) updateProfile({ best_streak: computed.record });
  }, [profile, isLoading, computed.record, stored, updateProfile]);

  const streak = useMemo(() => ({ ...computed, record: Math.max(computed.record, stored) }), [computed, stored]);
  return { streak, isLoading };
}
