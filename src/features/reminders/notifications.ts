import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const REMINDERS_SUPPORTED = true;

const CHANNEL_ID = 'habit-reminders';

export type ReminderNotification = { fireAt: Date; title: string; body: string; habitId: string };

let configured = false;

export async function configureNotifications(channelName: string) {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: channelName,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
    });
  }
}

/** Asks for permission only when it has not been decided yet. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowSound: true, allowBadge: false },
  });
  return requested.granted;
}

/** Replaces every pending reminder with the given set. */
export async function replaceScheduledReminders(reminders: ReminderNotification[]) {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const reminder of reminders) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        data: { habitId: reminder.habitId },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.fireAt,
        channelId: CHANNEL_ID,
      },
    });
  }
}
