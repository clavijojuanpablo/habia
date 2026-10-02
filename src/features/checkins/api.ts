import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

import {
  toggleLogRequest,
  TOGGLE_LOG_KEY,
  TOGGLE_LOG_SCOPE,
  type HabitLog,
  type LogStatus,
  type ToggleInput,
} from './mutations';

export type { HabitLog, LogStatus };

const LOGS_PAGE = 1000;

const logsKey = (from: Date, to: Date) => ['logs', from.toISOString(), to.toISOString()] as const;

/** Logs whose occurrence falls in [from, to). */
export function useLogs(from: Date, to: Date) {
  return useQuery({
    queryKey: logsKey(from, to),
    // The key carries the dates: yesterday's windows (up to 400 days) must not pile up in the
    // persisted cache, which on the web lives in localStorage (~5 MB).
    gcTime: 24 * 60 * 60 * 1000,
    queryFn: async () => {
      // The API returns at most 1000 rows per request (PostgREST max_rows) and cuts silently:
      // page through in a stable order so long windows (the streak reads 400 days) are complete.
      const rows: HabitLog[] = [];
      for (let page = 0; ; page++) {
        const { data, error } = await supabase
          .from('habit_logs')
          .select('*')
          .gte('occurrence_at', from.toISOString())
          .lt('occurrence_at', to.toISOString())
          .order('occurrence_at')
          .order('id')
          .range(page * LOGS_PAGE, (page + 1) * LOGS_PAGE - 1);
        if (error) throw error;
        rows.push(...data);
        if (data.length < LOGS_PAGE) return rows;
      }
    },
  });
}

/**
 * Checks or un-checks an occurrence, updating every cached range optimistically.
 * Offline the write is paused and retried when the connection returns; the
 * optimistic cache is persisted, so the check mark survives a restart.
 */
export function useToggleLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: TOGGLE_LOG_KEY,
    mutationFn: toggleLogRequest,
    scope: TOGGLE_LOG_SCOPE,
    onMutate: async ({ habitId, at, existing, status = 'done' }: ToggleInput) => {
      await queryClient.cancelQueries({ queryKey: ['logs'] });
      const snapshot = queryClient.getQueriesData<HabitLog[]>({ queryKey: ['logs'] });

      for (const [key, logs] of snapshot) {
        if (!logs) continue;
        const [, from, to] = key as ReturnType<typeof logsKey>;
        if (at < from || at >= to) continue;
        const next = existing
          ? logs.filter((l) => l.id !== existing.id)
          : [
              ...logs,
              {
                id: `optimistic-${habitId}-${at}`,
                habit_id: habitId,
                user_id: '',
                occurrence_at: at,
                status,
                note: null,
                mood: null,
                logged_at: new Date().toISOString(),
              },
            ];
        queryClient.setQueryData(key, next);
      }
      return { snapshot };
    },
    onError: (_error, _input, context) => {
      context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ['logs'] }),
        queryClient.invalidateQueries({ queryKey: ['votes'] }),
        queryClient.invalidateQueries({ queryKey: ['completions'] }),
        // Shared circle habits: the group card must count this check-in right away.
        queryClient.invalidateQueries({ queryKey: ['social'] }),
      ]),
  });
}
