import { useMutation, useQueryClient } from '@tanstack/react-query';

import { requireUserId } from '@/features/auth/session-provider';
import type { IdentityArea } from '@/features/identities/api';
import { formatLocalDate } from '@/lib/recurrence';
import { track } from '@/lib/analytics';
import { supabase } from '@/lib/supabase/client';

import type { Obstacle } from './data';

export type OnboardingResult = {
  area: IdentityArea;
  statement: string;
  habit: { name: string; icon: string; color: string; time?: string; twoMinute: string };
  obstacle: Obstacle;
};

/**
 * Creates the first identity and habit in one go and marks onboarding as done.
 * The obstacle picks the mechanism: forgetting → reminder, no time → start from
 * the 2-minute version only, motivation → a visible identity to vote for.
 */
export function useCompleteOnboarding() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ area, statement, habit, obstacle }: OnboardingResult) => {
      const user_id = await requireUserId();

      // Three writes without a transaction: a retry after a partial failure reuses what the
      // previous attempt already created instead of adding a second identity or habit.
      const { data: previous } = await supabase
        .from('identities')
        .select('id')
        .eq('statement', statement)
        .eq('area', area)
        .limit(1)
        .maybeSingle();
      let identityId = previous?.id;
      if (!identityId) {
        const { data, error } = await supabase
          .from('identities')
          .insert({ user_id, statement, area, color: habit.color })
          .select('id')
          .single();
        if (error) throw error;
        identityId = data.id;
      }

      const { count: existingHabits } = await supabase
        .from('habits')
        .select('id', { count: 'exact', head: true })
        .eq('identity_id', identityId)
        .eq('name', habit.name);

      const { error: habitError } = existingHabits
        ? { error: null }
        : await supabase.from('habits').insert({
            user_id,
            identity_id: identityId,
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            rrule: 'FREQ=DAILY',
            starts_on: formatLocalDate(new Date()),
            window_start: habit.time ? `${habit.time}:00` : null,
            two_minute_version: habit.twoMinute,
            reminder_minutes_before: habit.time && obstacle === 'forget' ? 0 : null,
          });
      if (habitError) throw habitError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ onboarded_at: new Date().toISOString() })
        .eq('id', user_id);
      if (profileError) throw profileError;
      track('onboarding_completed', { obstacle });
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['habits'] }),
        queryClient.invalidateQueries({ queryKey: ['identities'] }),
      ]),
  });
}

/** Lets an existing user skip the flow without creating anything. */
export function useSkipOnboarding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const user_id = await requireUserId();
      const { error } = await supabase
        .from('profiles')
        .update({ onboarded_at: new Date().toISOString() })
        .eq('id', user_id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}
