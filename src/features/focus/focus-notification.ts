import * as Notifications from 'expo-notifications';

const ID = 'focus-timer';

/**
 * A local notice for when the timer ends, in case the app is in the background then. Marked
 * `kind: 'focus'` so syncing reminders never cancels it; tapping it opens the habit on Today.
 */
export async function scheduleFocusEnd(endsAt: number, title: string, body: string, habitId: string) {
  await cancelFocusEnd();
  if (endsAt <= Date.now()) return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;
  await Notifications.scheduleNotificationAsync({
    identifier: ID,
    content: { title, body, data: { kind: 'focus', habitId }, sound: 'default' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(endsAt) },
  });
}

export async function cancelFocusEnd() {
  await Notifications.cancelScheduledNotificationAsync(ID).catch(() => {});
}
