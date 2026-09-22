// Local scheduled notifications are not available on web; reminders are a no-op there.

export const REMINDERS_SUPPORTED = false;

export type ReminderNotification = { fireAt: Date; title: string; body: string; habitId: string };

export async function configureNotifications(_channelName: string) {}

export async function ensureNotificationPermission(): Promise<boolean> {
  return false;
}

export async function replaceScheduledReminders(_reminders: ReminderNotification[]) {}
