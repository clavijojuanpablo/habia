import { useEffect, useMemo } from 'react';

import { useLogs } from '@/features/checkins/api';
import { useHabitHistory } from '@/features/habits/api';
import { useDayBands, useProfile, useUpdateProfile } from '@/features/profile/api';
import { dailyTotals } from '@/features/stats/compute-stats';
import { addDays } from '@/lib/recurrence';

import { computeStreak } from './compute-streak';

const STREAK_WINDOW_DAYS = 400;

/**
 * App-wide day streak over its own 400-day window (more than the 365-day goal; the garden's
 * 120 days would freeze it at 121). The record is the larger of the computed one and
 * `profiles.best_streak`, raised when beaten, so a record older than the window never fades.
 */
export function useStreak(today: Date) {
  const from = useMemo(() => addDays(today, -STREAK_WINDOW_DAYS), [today]);
  const to = useMemo(() => addDays(today, 1), [today]);
  const habits = useHabitHistory();
  const logs = useLogs(from, to);
  const bands = useDayBands();
  const isLoading = habits.isLoading || logs.isLoading;
  const days = useMemo(
    () => dailyTotals(habits.data ?? [], logs.data ?? [], from, today, bands),
    [habits.data, logs.data, from, today, bands],
  );
  const { data: profile } = useProfile();
  const { mutate: updateProfile } = useUpdateProfile();
  const computed = useMemo(() => computeStreak(days, today), [days, today]);
  const stored = profile?.best_streak ?? 0;

  useEffect(() => {
    if (profile && !isLoading && computed.record > stored) updateProfile({ best_streak: computed.record });
  }, [profile, isLoading, computed.record, stored, updateProfile]);

  const streak = useMemo(() => ({ ...computed, record: Math.max(computed.record, stored) }), [computed, stored]);
  return { streak, isLoading };
}
