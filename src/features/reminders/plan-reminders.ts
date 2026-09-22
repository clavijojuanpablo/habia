import { isDone, type ScheduledItem } from '@/features/schedule/build-schedule';

/** iOS keeps at most 64 pending local notifications; leave some headroom. */
export const MAX_SCHEDULED_REMINDERS = 60;

export type PlannedReminder = {
  item: ScheduledItem;
  fireAt: Date;
};

/**
 * Picks which occurrences deserve a local notification: timed, reminder enabled,
 * not already done, and firing in the future. Soonest first, capped.
 */
export function planReminders(
  items: ScheduledItem[],
  now: Date,
  limit = MAX_SCHEDULED_REMINDERS,
): PlannedReminder[] {
  return items
    .flatMap((item) => {
      const minutes = item.habit.reminder_minutes_before;
      if (!item.hasTime || minutes === null || isDone(item)) return [];
      const fireAt = new Date(item.at.getTime() - minutes * 60_000);
      return fireAt > now ? [{ item, fireAt }] : [];
    })
    .sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime())
    .slice(0, limit);
}
