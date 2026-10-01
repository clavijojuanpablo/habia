import { isDone, isSkipped, type ScheduledItem } from '@/features/schedule/build-schedule';

/**
 * The identity whose day this check-in just finished: `item` is being completed and every other
 * item of the same identity today is already done (rests on purpose are left out). Only for
 * identities with at least two different habits today, so it marks a whole branch, not the last
 * slot of a single "every 3 hours" habit.
 * The caller lets "day complete" win when the same tap also finishes the day.
 */
export function completedIdentity(item: ScheduledItem, items: ScheduledItem[]): string | null {
  const identityId = item.habit.identity_id;
  if (!identityId || isDone(item)) return null;
  const branch = items.filter((other) => other.habit.identity_id === identityId && !isSkipped(other));
  if (new Set(branch.map((other) => other.habit.id)).size < 2) return null;
  return branch.every((other) => other.key === item.key || isDone(other)) ? identityId : null;
}
