import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useLogs } from '@/features/checkins/api';
import { useHabits } from '@/features/habits/api';
import { addDays } from '@/lib/recurrence';
import { supabase } from '@/lib/supabase/client';

import { computeGarden, GARDEN_WINDOW_DAYS } from './compute-garden';

export const votesKey = ['votes'] as const;

/**
 * All-time completions: every one is a vote for the person you want to become.
 * Bounded by `until` (tomorrow's local midnight) so a log for a day that has not
 * arrived can never inflate the tree.
 */
function useVotes(until: Date) {
  return useQuery({
    queryKey: votesKey,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('habit_logs')
        .select('id', { count: 'exact', head: true })
        .in('status', ['done', 'done_minimum'])
        .lt('occurrence_at', until.toISOString());
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useGarden(today: Date, now: Date) {
  const from = useMemo(() => addDays(today, -GARDEN_WINDOW_DAYS), [today]);
  const to = useMemo(() => addDays(today, 1), [today]);

  const habits = useHabits();
  const logs = useLogs(from, to);
  const votes = useVotes(to);

  const summary = useMemo(
    () => computeGarden(habits.data ?? [], logs.data ?? [], votes.data ?? 0, now),
    [habits.data, logs.data, votes.data, now],
  );

  return {
    summary,
    isLoading: habits.isLoading || logs.isLoading || votes.isLoading,
    error: habits.error ?? logs.error ?? votes.error,
  };
}
