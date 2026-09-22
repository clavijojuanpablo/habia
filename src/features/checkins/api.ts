import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { requireUserId } from '@/features/auth/session-provider';
import { supabase, type Tables } from '@/lib/supabase/client';

export type HabitLog = Tables<'habit_logs'>;
export type LogStatus = HabitLog['status'];

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

type ToggleInput = {
  habitId: string;
  at: Date;
  /** Existing log to remove. When absent, a new log with `status` is created. */
  existing?: HabitLog;
  status?: LogStatus;
};

/** Checks or un-checks an occurrence, updating every cached range optimistically. */
export function useToggleLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ habitId, at, existing, status = 'done' }: ToggleInput) => {
      if (existing) {
        const { error } = await supabase
          .from('habit_logs')
          .delete()
          .eq('habit_id', existing.habit_id)
          .eq('occurrence_at', existing.occurrence_at);
        if (error) throw error;
        return;
      }
      const user_id = await requireUserId();
      const { error } = await supabase
        .from('habit_logs')
        .upsert(
          { user_id, habit_id: habitId, occurrence_at: at.toISOString(), status },
          { onConflict: 'habit_id,occurrence_at' },
        );
      if (error) throw error;
    },
    onMutate: async ({ habitId, at, existing, status = 'done' }) => {
      await queryClient.cancelQueries({ queryKey: ['logs'] });
      const snapshot = queryClient.getQueriesData<HabitLog[]>({ queryKey: ['logs'] });
      const iso = at.toISOString();

      for (const [key, logs] of snapshot) {
        if (!logs) continue;
        const [, from, to] = key as ReturnType<typeof logsKey>;
        if (iso < from || iso >= to) continue;
        const next = existing
          ? logs.filter((l) => l.id !== existing.id)
          : [
              ...logs,
              {
                id: `optimistic-${habitId}-${iso}`,
                habit_id: habitId,
                user_id: '',
                occurrence_at: iso,
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
