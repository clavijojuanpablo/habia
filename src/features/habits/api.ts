import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { requireUserId } from '@/features/auth/session-provider';
import { track } from '@/lib/analytics';
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
  | 'cue_type'
  | 'anchor_habit_id'
  | 'context_label'
  | 'identity_id'
>;

const habitsKey = ['habits'] as const;

/**
 * One cached request with every habit, archived ones included: the past needs them (an archived
 * habit's days still count in the streak and stats until the day it was archived).
 */
function useHabitsQuery<T>(select: (habits: Habit[]) => T) {
  return useQuery({
    queryKey: habitsKey,
    queryFn: async () => {
      const { data, error } = await supabase.from('habits').select('*').order('sort_order').order('created_at');
      if (error) throw error;
      return data;
    },
    select,
  });
}

const activeOnly = (habits: Habit[]) => habits.filter((h) => !h.archived_at);
const all = (habits: Habit[]) => habits;

/** Habits in use: Today, the week, reminders, forms, the garden. */
export function useHabits() {
  return useHabitsQuery(activeOnly);
}

/** Every habit, archived included: for history (streak, stats, calendar), cut at each archive date. */
export function useHabitHistory() {
  return useHabitsQuery(all);
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
      track('habit_created', {
        cue_type: input.cue_type ?? null,
        two_minute: !!input.two_minute_version,
        reminder: input.reminder_minutes_before != null,
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: habitsKey }),
  });
}

/** Links a habit to an identity (a branch of the tree) in one tap; shown at once, saved behind. */
export function useAssignIdentity() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ habitId, identityId }: { habitId: string; identityId: string | null }) => {
      const { error } = await supabase.from('habits').update({ identity_id: identityId }).eq('id', habitId);
      if (error) throw error;
    },
    onMutate: async ({ habitId, identityId }) => {
      await queryClient.cancelQueries({ queryKey: habitsKey });
      const previous = queryClient.getQueryData<Habit[]>(habitsKey);
      queryClient.setQueryData<Habit[]>(habitsKey, (old) =>
        old?.map((h) => (h.id === habitId ? { ...h, identity_id: identityId } : h)),
      );
      return { previous };
    },
    onError: (_error, _input, context) => queryClient.setQueryData(habitsKey, context?.previous),
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
