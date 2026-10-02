import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

import { toggleLogRequest, TOGGLE_LOG_KEY, TOGGLE_LOG_SCOPE } from '@/features/checkins/mutations';
import { shortLogWindows } from '@/features/checkins/api';
import { storage } from '@/lib/storage';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      // Keep cached data usable offline for a week.
      gcTime: 7 * 24 * 60 * 60 * 1000,
    },
    mutations: { retry: 2 },
  },
});

/**
 * Registered by mutation key so a check-in queued while offline can be replayed
 * after a restart, when the original hook (and its closure) no longer exists. Without the
 * hook there is no optimistic snapshot to roll back, so success or failure both refetch:
 * the cache then shows what the server really has.
 */
queryClient.setMutationDefaults(TOGGLE_LOG_KEY, {
  mutationFn: toggleLogRequest,
  scope: TOGGLE_LOG_SCOPE,
  onSettled: () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['logs'], predicate: shortLogWindows }),
      queryClient.invalidateQueries({ queryKey: ['votes'] }),
      queryClient.invalidateQueries({ queryKey: ['completions'] }),
      // A replayed check-in on a shared habit moves its circle's numbers too.
      queryClient.invalidateQueries({ queryKey: ['social'] }),
    ]),
});

/** Writes the cache to disk so the app opens with data even without a connection. */
export const persister = createAsyncStoragePersister({
  storage,
  key: 'habits-query-cache',
  throttleTime: 1000,
});

