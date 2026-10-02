import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { useSession } from '@/features/auth/session-provider';
import { onProChange } from '@/lib/purchases';
import { supabase } from '@/lib/supabase/client';

const activeUntil = (proUntil: string | null | undefined) =>
  proUntil === 'infinity' || (!!proUntil && Date.parse(proUntil) > Date.now());

/**
 * Whether the signed-in person has Pro. Two sources, either is enough: the store on this phone
 * (instant right after buying) and the server's mirror kept by the RevenueCat webhook (the web,
 * and another phone where the purchase was not made).
 */
export function usePro(): { isPro: boolean; isLoading: boolean } {
  const { session } = useSession();
  const userId = session?.user.id;
  // Each answer remembers whose it was: while the store switches accounts, the previous
  // account's Pro is never shown.
  const [store, setStore] = useState<{ userId?: string; pro: boolean }>({ pro: false });
  useEffect(() => onProChange((pro) => setStore({ userId, pro })), [userId]);
  const storePro = store.userId === userId && store.pro;

  const server = useQuery({
    queryKey: ['entitlement', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase.from('entitlements').select('pro_until').maybeSingle();
      if (error) throw error;
      return data?.pro_until ?? null;
    },
  });
  return { isPro: storePro || activeUntil(server.data), isLoading: server.isLoading };
}
