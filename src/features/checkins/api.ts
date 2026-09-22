import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';

import { toggleLogRequest, TOGGLE_LOG_KEY, type HabitLog, type LogStatus, type ToggleInput } from './mutations';

export type { HabitLog, LogStatus };

const logsKey = (from: Date, to: Date) => ['logs', from.toISOString(), to.toISOString()] as const;

/** Logs whose occurrence falls in [from, to). */
export function useLogs(from: Date, to: Date) {
  return useQuery({
    queryKey: logsKey(from, to),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habit_logs')
        .select('*')
        .gte('occurrence_at', from.toISOString())
        .lt('occurrence_at', to.toISOString());
      if (error) throw error;
      return data;
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
      ]),
  });
}
