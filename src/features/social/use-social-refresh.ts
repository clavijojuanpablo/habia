import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

/**
 * Pull-to-refresh for social screens: refetches everything social (requests, cheers, circles,
 * photos) and keeps the spinner until it arrives.
 */
export function useSocialRefresh() {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['social'] });
    } finally {
      setRefreshing(false);
    }
  }, [queryClient]);
  return { refreshing, onRefresh };
}
