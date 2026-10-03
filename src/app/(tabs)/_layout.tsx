import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import { AppTabBar } from '@/components/app-tab-bar';
import { useSession } from '@/features/auth/session-provider';
import { registerPushToken } from '@/features/push/push-token';
import {
  useNotificationReceived,
  useNotificationTap,
  type NotificationData,
} from '@/features/reminders/notifications';
import { useReminderSync } from '@/features/reminders/use-reminder-sync';
import { useFriendships, useMySocialProfile } from '@/features/social/api';
import { useUnseenCheers } from '@/features/social/components/cheers';
import { usePhotoQueue } from '@/features/social/use-photo-queue';
import { SocialStatsSync } from '@/features/social/use-sync-social-stats';
import { track } from '@/lib/analytics';

export default function TabsLayout() {
  const { t } = useTranslation();
  useReminderSync();
  usePhotoQueue();
  const { data: socialProfile } = useMySocialProfile();
  // A dot on Profile when someone is waiting: a request to answer or a cheer not yet seen.
  const { data: friendships } = useFriendships();
  const unseenCheers = useUnseenCheers();
  const friendsNews = unseenCheers.length > 0 || (friendships ?? []).some((f) => f.status === 'pending' && f.incoming);
  // Keep this phone's push token on the account (only if notifications are allowed), also on
  // every return to the app: notifications may have been allowed in Settings meanwhile.
  const { session } = useSession();
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    registerPushToken(userId);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') registerPushToken(userId);
    });
    return () => subscription.remove();
  }, [userId]);
  // A tapped notification opens what it was about. A reminder brings its habit into focus on
  // Today, one tap away from the check-in; a social push opens the person or the circle.
  // A social push means something changed on the server (a request, a cheer, a photo): refetch
  // right away instead of waiting for the cache to go stale, so the screen it opens is current.
  const queryClient = useQueryClient();
  const refreshSocial = useCallback(
    (data: NotificationData) => {
      if (typeof data.type === 'string') queryClient.invalidateQueries({ queryKey: ['social'] });
    },
    [queryClient],
  );
  useNotificationReceived(refreshSocial);
  const openNotification = useCallback((data: NotificationData) => {
    refreshSocial(data);
    const id = typeof data.id === 'string' ? data.id : null;
    if (data.kind === 'focus') return;
    if (typeof data.habitId === 'string') {
      track('reminder_opened');
      router.navigate({ pathname: '/', params: { focus: data.habitId } });
    } else if (data.type === 'cheer' && typeof data.from === 'string') {
      router.push({ pathname: '/friend/[id]', params: { id: data.from } });
    } else if (data.type === 'friend' && id) {
      router.push({ pathname: '/friend/[id]', params: { id } });
    } else if (data.type === 'circle' && id) {
      router.push({ pathname: '/circle/[id]', params: { id } });
    } else if (data.type === 'friend_request') {
      router.navigate('/profile');
    }
  }, [refreshSocial]);
  useNotificationTap(openNotification);

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
