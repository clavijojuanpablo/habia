import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import type { Identity } from '@/features/identities/api';

export type Branch = { identity: Identity; habits: Habit[]; seedsThisWeek: number };

/**
 * The tree's branches: each identity with the habits that feed it and the seeds (completions)
 * planted for it this week. Habits without an identity are "loose seeds": they grow no branch.
 */
export function computeBranches(identities: Identity[], habits: Habit[], logs: HabitLog[], weekStart: Date) {
  const habitIdentity = new Map(habits.map((h) => [h.id, h.identity_id]));
  const seeds = new Map<string, number>();
  for (const log of logs) {
    if (log.status !== 'done' && log.status !== 'done_minimum') continue;
    if (new Date(log.occurrence_at) < weekStart) continue;
    const identityId = habitIdentity.get(log.habit_id);
    if (identityId) seeds.set(identityId, (seeds.get(identityId) ?? 0) + 1);
  }
  const branches: Branch[] = identities.map((identity) => ({
    identity,
    habits: habits.filter((h) => h.identity_id === identity.id),
    seedsThisWeek: seeds.get(identity.id) ?? 0,
  }));
  const known = new Set(identities.map((i) => i.id));
  const loose = habits.filter((h) => !h.identity_id || !known.has(h.identity_id));
  return { branches, loose };
}
