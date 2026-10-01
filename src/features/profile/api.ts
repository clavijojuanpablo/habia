import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useSession } from '@/features/auth/session-provider';
import { supabase, type TablesUpdate } from '@/lib/supabase/client';
import { dayBandsFromProfile } from '@/lib/time/day-bands';

export function useProfile() {
  const { session } = useSession();
  return useQuery({
    queryKey: ['profile', session?.user.id],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('*').single();
      if (error) throw error;
      return data;
    },
  });
}

/** Stable while the four boundaries do not change: schedules and stats memoize on it. */
export function useDayBands() {
  const { data } = useProfile();
  const morning = data?.morning_starts_at;
  const afternoon = data?.afternoon_starts_at;
  const night = data?.night_starts_at;
  const nightEnds = data?.night_ends_at;
  return useMemo(
    () =>
      dayBandsFromProfile(
        morning === undefined || afternoon === undefined || night === undefined || nightEnds === undefined
          ? null
          : {
              morning_starts_at: morning,
              afternoon_starts_at: afternoon,
              night_starts_at: night,
              night_ends_at: nightEnds,
            },
      ),
    [morning, afternoon, night, nightEnds],
  );
}

const PROFILE_UPDATE_KEY = ['profile', 'update'];

export function useUpdateProfile() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const key = ['profile', session?.user.id];

  return useMutation({
    // Quick successive edits (a stepper tapped twice) are written in order, one at a time.
    mutationKey: PROFILE_UPDATE_KEY,
    scope: { id: 'profile' },
    mutationFn: async (changes: TablesUpdate<'profiles'>) => {
      if (!session) throw new Error('Not signed in');
      const { error } = await supabase.from('profiles').update(changes).eq('id', session.user.id);
      if (error) throw error;
    },
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: key });
      queryClient.setQueryData(key, (old: object | undefined) => (old ? { ...old, ...changes } : old));
    },
    // Refetch only after the last pending edit: an earlier one settling would pull an in-between
    // value over the newer optimistic one (and a failure is corrected by the same refetch, instead
    // of rolling back to a snapshot that predates the later edits).
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey: PROFILE_UPDATE_KEY }) <= 1) {
        return queryClient.invalidateQueries({ queryKey: key });
      }
    },
  });
}
