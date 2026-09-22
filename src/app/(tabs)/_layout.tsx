import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { AppTabBar } from '@/components/app-tab-bar';
import { useReminderSync } from '@/features/reminders/use-reminder-sync';

export default function TabsLayout() {
  const { t } = useTranslation();
  useReminderSync();

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
