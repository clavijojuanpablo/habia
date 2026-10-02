import { useEffect, useMemo } from 'react';

import { useLogs, type HabitLog } from '@/features/checkins/api';
import { useHabitHistory, type Habit } from '@/features/habits/api';
import { useDayBands, useProfile, useUpdateProfile } from '@/features/profile/api';
import { dailyTotals, type DayStat } from '@/features/stats/compute-stats';
import type { DayBandConfig } from '@/lib/time/day-bands';
import { addDays } from '@/lib/recurrence';

import { computeStreak } from './compute-streak';

const STREAK_WINDOW_DAYS = 400;

const NO_HABITS: Habit[] = [];
const NO_LOGS: HabitLog[] = [];

/**
 * Every screen's top bar, Progress, the streak screen and the friends' snapshot all ask for the
 * streak: compute the 400 days once per change of data, not once per caller. The inputs are cached
 * query results, so the same references mean the same answer.
 */
let last: { inputs: unknown[]; days: DayStat[] } | null = null;
function sharedDailyTotals(habits: Habit[], logs: HabitLog[], from: Date, today: Date, bands: DayBandConfig) {
  const inputs = [habits, logs, from.getTime(), today.getTime(), bands];
  if (!last || inputs.some((value, i) => value !== last!.inputs[i])) {
    last = { inputs, days: dailyTotals(habits, logs, from, today, bands) };
  }
  return last.days;
}

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
  // A failed read is not a broken streak: callers that publish it must wait for real data.
  const isError = habits.isError || logs.isError;
  const days = useMemo(
    () => sharedDailyTotals(habits.data ?? NO_HABITS, logs.data ?? NO_LOGS, from, today, bands),
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
  return { streak, isLoading, isError };
}
