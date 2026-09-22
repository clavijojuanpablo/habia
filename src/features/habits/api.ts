import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { requireUserId } from '@/features/auth/session-provider';
import { formatLocalDate } from '@/lib/recurrence';
import { supabase, type Tables, type TablesInsert } from '@/lib/supabase/client';

export type Habit = Tables<'habits'>;

export type HabitInput = Pick<
  TablesInsert<'habits'>,
  | 'name'
  | 'icon'
  | 'color'
  | 'rrule'
  | 'window_start'
  | 'window_end'
  | 'two_minute_version'
  | 'implementation_intention'
  | 'reminder_minutes_before'
>;

const habitsKey = ['habits'] as const;

export function useHabits() {
  return useQuery({
    queryKey: habitsKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .is('archived_at', null)
        .order('sort_order')
        .order('created_at');
      if (error) throw error;
      return data;
    },
  });
}

export function useHabit(id: string | undefined) {
  const query = useHabits();
  return { ...query, data: query.data?.find((h) => h.id === id) };
}

export function useSaveHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: HabitInput & { id?: string }) => {
      if (id) {
        const { error } = await supabase.from('habits').update(input).eq('id', id);
        if (error) throw error;
        return;
      }
      const user_id = await requireUserId();
      const { error } = await supabase.from('habits').insert({
        ...input,
        user_id,
        // Local date: the DB default (current_date) is UTC and can be off by a day.
        starts_on: formatLocalDate(new Date()),
      });
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: habitsKey }),
  });
}

export function useArchiveHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('habits')
        .update({ archived_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: habitsKey }),
  });
}
