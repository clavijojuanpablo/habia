import { keepPreviousData, useMutation, useQuery, useQueryClient, type Query } from '@tanstack/react-query';

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

/** Windows longer than this (the streak's 400 days) are kept fresh by optimistic updates, not refetches. */
const LONG_WINDOW_MS = 200 * 24 * 60 * 60 * 1000;
const isLongWindow = (from: string, to: string) => Date.parse(to) - Date.parse(from) > LONG_WINDOW_MS;

/**
 * After a check-in, refetch the short windows (Today, the week, the garden) but not the long one:
 * re-downloading 400 days on every tap is slow and heavy, and the optimistic update already holds
 * it. It still refreshes when the app comes back and every few minutes.
 */
export const shortLogWindows = (query: Query) => {
  const [, from, to] = query.queryKey as string[];
  return !isLongWindow(from, to);
};

const logsKey = (from: Date, to: Date) => ['logs', from.toISOString(), to.toISOString()] as const;

/** Logs whose occurrence falls in [from, to). */
export function useLogs(from: Date, to: Date) {
  return useQuery({
    queryKey: logsKey(from, to),
    ...(isLongWindow(from.toISOString(), to.toISOString()) && {
      staleTime: 10 * 60 * 1000,
      // A new day changes the key: keep showing yesterday's streak while the new window loads.
      placeholderData: keepPreviousData,
    }),
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
        // Matched by habit and time, not id: a window may still hold this occurrence's optimistic row.
        const next = existing
          ? logs.filter((l) => !(l.habit_id === habitId && Date.parse(l.occurrence_at) === Date.parse(at)))
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
        queryClient.invalidateQueries({ queryKey: ['logs'], predicate: shortLogWindows }),
        queryClient.invalidateQueries({ queryKey: ['votes'] }),
        queryClient.invalidateQueries({ queryKey: ['completions'] }),
        // Shared circle habits: the group card must count this check-in right away.
        queryClient.invalidateQueries({ queryKey: ['social'] }),
      ]),
  });
}
