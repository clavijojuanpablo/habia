import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { AppTabBar } from '@/components/app-tab-bar';
import { useNotificationTap } from '@/features/reminders/notifications';
import { useReminderSync } from '@/features/reminders/use-reminder-sync';

export default function TabsLayout() {
  const { t } = useTranslation();
  useReminderSync();
  // Tapping a reminder brings its habit into focus on Today, one tap away from the check-in,
  // whether it launched the app or not. A reminder asks for action, not for editing.
  const openHabit = useCallback((habitId: string) => {
    router.navigate({ pathname: '/', params: { focus: habitId } });
  }, []);
  useNotificationTap(openHabit);

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: t('tabs.today') }} />
      <Tabs.Screen name="week" options={{ title: t('tabs.week') }} />
      <Tabs.Screen name="garden" options={{ title: t('tabs.garden') }} />
      <Tabs.Screen name="progress" options={{ title: t('tabs.progress') }} />
      <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
    </Tabs>
  );
}
