import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { requireUserId } from '@/features/auth/session-provider';
import { supabase, type Tables, type TablesInsert } from '@/lib/supabase/client';

export type Identity = Tables<'identities'>;
export type IdentityInput = Pick<TablesInsert<'identities'>, 'statement' | 'area' | 'color'>;

/** Areas double as the identity's emoji in the UI. */
export const IDENTITY_AREAS = {
  health: '💪',
  mind: '🧠',
  relationships: '❤️',
  work: '💼',
  growth: '🌱',
} as const;
export type IdentityArea = keyof typeof IDENTITY_AREAS;

export function identityEmoji(identity: Pick<Identity, 'area'>) {
  return IDENTITY_AREAS[(identity.area ?? 'growth') as IdentityArea] ?? IDENTITY_AREAS.growth;
}

const identitiesKey = ['identities'] as const;

export function useIdentities() {
  return useQuery({
    queryKey: identitiesKey,
    queryFn: async () => {
      const { data, error } = await supabase.from('identities').select('*').order('sort_order').order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: IdentityInput & { id?: string }) => {
      if (id) {
        const { error } = await supabase.from('identities').update(input).eq('id', id);
        if (error) throw error;
        return;
      }
      const user_id = await requireUserId();
      const { error } = await supabase.from('identities').insert({ ...input, user_id });
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: identitiesKey }),
  });
}

export function useDeleteIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // habits.identity_id is ON DELETE SET NULL: habits survive, just unassigned.
      const { error } = await supabase.from('identities').delete().eq('id', id);
      if (error) throw error;
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: identitiesKey }),
        queryClient.invalidateQueries({ queryKey: ['habits'] }),
      ]),
  });
}
