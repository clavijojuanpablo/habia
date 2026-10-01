import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSession } from '@/features/auth/session-provider';
import { formatLocalDate } from '@/lib/recurrence';
import { supabase } from '@/lib/supabase/client';

import { lastWeekStart, type WeeklySummary } from './weekly-summary';

/** What Brote wrote, plus the numbers it was written from. */
export type WeeklyReviewContent = {
  title: string;
  win: string;
  pattern: string;
  suggestion: string;
  summary: WeeklySummary;
};

export type WeeklyReview = {
  id: string;
  period_start: string;
  content: WeeklyReviewContent;
  seen_at: string | null;
};

/** `none`: nothing stored yet; `no_data`: last week had nothing due, so there is nothing to review. */
type ReviewState = { status: 'ready'; review: WeeklyReview } | { status: 'none' } | { status: 'no_data' };

const availableKey = ['weekly-review', 'available'] as const;
const reviewKey = (userId: string | undefined, periodStart: string) => ['weekly-review', userId, periodStart];

/** Whether the server can write reviews at all (the Anthropic key is configured). */
export function useWeeklyReviewAvailable(enabled = true) {
  return useQuery({
    queryKey: availableKey,
    enabled,
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      // A failed call (offline, cold start) must not be cached as "unavailable": throw so it retries.
      const { data, error } = await supabase.functions.invoke('weekly-review', { body: { check: true } });
      if (error) throw error;
      return (data as { available?: boolean }).available === true;
    },
  });
}

/** Last finished week's review, if it was already written. */
export function useWeeklyReview(today: Date, enabled: boolean) {
  const { session } = useSession();
  const periodStart = formatLocalDate(lastWeekStart(today));
  return useQuery({
    queryKey: reviewKey(session?.user.id, periodStart),
    enabled: enabled && !!session,
    queryFn: async (): Promise<ReviewState> => {
      const { data, error } = await supabase
        .from('coach_messages')
        .select('id, period_start, content, seen_at')
        .eq('kind', 'weekly_review')
        .eq('period_start', periodStart)
        .maybeSingle();
      if (error) throw error;
      return data ? { status: 'ready', review: data as unknown as WeeklyReview } : { status: 'none' };
    },
  });
}

/** Asks the server to write last week's review (idempotent: one per week). */
export function useGenerateWeeklyReview(today: Date) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const periodStart = formatLocalDate(lastWeekStart(today));
  return useMutation({
    mutationFn: async (): Promise<ReviewState> => {
      const { data, error } = await supabase.functions.invoke('weekly-review', { body: {} });
      if (error) throw error;
      const result = data as { status: 'ready'; review: WeeklyReview } | { status: 'no_data' };
      return result;
    },
    onSuccess: (state) => queryClient.setQueryData(reviewKey(session?.user.id, periodStart), state),
  });
}

/** Stamps the review as read so the Today card goes away. */
export function useMarkReviewSeen(today: Date) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const key = reviewKey(session?.user.id, formatLocalDate(lastWeekStart(today)));
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coach_messages').update({ seen_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
    },
    onMutate: (id) =>
      queryClient.setQueryData(key, (old: ReviewState | undefined) =>
        old?.status === 'ready' && old.review.id === id
          ? { ...old, review: { ...old.review, seen_at: new Date().toISOString() } }
          : old,
      ),
  });
}
