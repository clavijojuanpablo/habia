import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

import { toggleLogRequest, TOGGLE_LOG_KEY } from '@/features/checkins/mutations';
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
 * after a restart, when the original hook (and its closure) no longer exists.
 */
queryClient.setMutationDefaults(TOGGLE_LOG_KEY, { mutationFn: toggleLogRequest });

/** Writes the cache to disk so the app opens with data even without a connection. */
export const persister = createAsyncStoragePersister({
  storage,
  key: 'habits-query-cache',
  throttleTime: 1000,
});

