import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export function useDayBands() {
  const { data } = useProfile();
  return dayBandsFromProfile(data);
}

export function useUpdateProfile() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const key = ['profile', session?.user.id];

  return useMutation({
    mutationFn: async (changes: TablesUpdate<'profiles'>) => {
      if (!session) throw new Error('Not signed in');
      const { error } = await supabase.from('profiles').update(changes).eq('id', session.user.id);
      if (error) throw error;
    },
    onMutate: async (changes) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData(key);
      queryClient.setQueryData(key, (old: object | undefined) => (old ? { ...old, ...changes } : old));
      return { previous };
    },
    onError: (_error, _changes, context) => queryClient.setQueryData(key, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
