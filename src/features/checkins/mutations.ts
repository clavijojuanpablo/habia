import { requireUserId } from '@/features/auth/session-provider';
import { supabase, type Tables } from '@/lib/supabase/client';

export type HabitLog = Tables<'habit_logs'>;
export type LogStatus = HabitLog['status'];

/** Mutation key used to resume check-ins that were queued while offline. */
export const TOGGLE_LOG_KEY = ['logs', 'toggle'] as const;

export type ToggleInput = {
  habitId: string;
  /** ISO string: a queued mutation is stored on disk, where Dates do not survive. */
  at: string;
  /** Existing log to remove. When absent, a new log with `status` is created. */
  existing?: HabitLog;
  status?: LogStatus;
};

/**
 * The write itself, defined outside the hook so TanStack Query can replay it
 * after a restart (mutation defaults are registered by mutation key).
 */
export async function toggleLogRequest({ habitId, at, existing, status = 'done' }: ToggleInput) {
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
    .upsert({ user_id, habit_id: habitId, occurrence_at: at, status }, { onConflict: 'habit_id,occurrence_at' });
  if (error) throw error;
}
