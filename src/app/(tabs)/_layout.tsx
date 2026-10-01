import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { AppTabBar } from '@/components/app-tab-bar';
import { useNotificationTap } from '@/features/reminders/notifications';
import { useReminderSync } from '@/features/reminders/use-reminder-sync';
import { useFriendships, useMySocialProfile } from '@/features/social/api';
import { useUnseenCheers } from '@/features/social/components/cheers';
import { SocialStatsSync } from '@/features/social/use-sync-social-stats';
import { track } from '@/lib/analytics';

export default function TabsLayout() {
  const { t } = useTranslation();
  useReminderSync();
  const { data: socialProfile } = useMySocialProfile();
  // A dot on Profile when someone is waiting: a request to answer or a cheer not yet seen.
  const { data: friendships } = useFriendships();
  const unseenCheers = useUnseenCheers();
  const friendsNews = unseenCheers.length > 0 || (friendships ?? []).some((f) => f.status === 'pending' && f.incoming);
  // Tapping a reminder brings its habit into focus on Today, one tap away from the check-in,
  // whether it launched the app or not. A reminder asks for action, not for editing.
  const openHabit = useCallback((habitId: string) => {
    track('reminder_opened');
    router.navigate({ pathname: '/', params: { focus: habitId } });
  }, []);
  useNotificationTap(openHabit);

  return (
    <>
      {socialProfile && <SocialStatsSync />}
      <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <AppTabBar {...props} />}>
        <Tabs.Screen name="index" options={{ title: t('tabs.today') }} />
        <Tabs.Screen name="week" options={{ title: t('tabs.week') }} />
        <Tabs.Screen name="garden" options={{ title: t('tabs.garden') }} />
        <Tabs.Screen name="progress" options={{ title: t('tabs.progress') }} />
        <Tabs.Screen name="profile" options={{ title: t('tabs.profile'), tabBarBadge: friendsNews ? '' : undefined }} />
      </Tabs>
    </>
  );
}
