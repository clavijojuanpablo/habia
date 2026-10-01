import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session-provider';
import {
  useCheersInbox,
  useCircles,
  useFriendships,
  useMarkCheersSeen,
  useMySocialProfile,
  useSocialDays,
  useSocialProfiles,
} from '@/features/social/api';
import { AddFriend } from '@/features/social/components/add-friend';
import { CheersInbox } from '@/features/social/components/cheers';
import { CircleCard, CirclesActions } from '@/features/social/components/circles';
import { FriendCard } from '@/features/social/components/friend-card';
import { Requests } from '@/features/social/components/requests';
import { SocialAvatar } from '@/features/social/components/social-avatar';
import { UsernameSetup } from '@/features/social/components/username-setup';
import { computeSharedStreak } from '@/features/social/shared-days';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';

/**
 * Friends is also your profile: your card first (what friends see), then requests, cheers,
 * friends with the streak you grow together, and circles. Settings live behind the gear.
 */
export default function FriendsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const { today } = useTodayRange(now);
  const { session } = useSession();
  const me = session?.user.id;

  const myProfile = useMySocialProfile();
  const friendships = useFriendships();
  const circles = useCircles();
  const cheers = useCheersInbox();
  const { mutate: markSeen } = useMarkCheersSeen();

  const accepted = useMemo(() => friendships.data?.filter((f) => f.status === 'accepted') ?? [], [friendships.data]);
  const pending = friendships.data?.filter((f) => f.status === 'pending') ?? [];
  const friendIds = accepted.map((f) => f.user_id);
  const profiles = useSocialProfiles(friendIds);
  const days = useSocialDays(me && friendIds.length > 0 ? [me, ...friendIds] : [], today);
  const profileById = Object.fromEntries((profiles.data ?? []).map((p) => [p.user_id, p]));

  const shared = useMemo(() => {
    const marks = days.data ?? [];
    const mine = marks.filter((m) => m.user_id === me);
    return Object.fromEntries(
      accepted.map((f) => [
        f.user_id,
        computeSharedStreak(
          mine,
          marks.filter((m) => m.user_id === f.user_id),
          today,
        ),
      ]),
    );
  }, [days.data, accepted, me, today]);

  // Looking at Friends is reading the cheers: they stop showing on Today and on the tab.
  const hasUnseen = (cheers.data ?? []).some((c) => !c.seen_at);
  useFocusEffect(
    useCallback(() => {
      if (hasUnseen) markSeen();
    }, [hasUnseen, markSeen]),
  );

  const stats = myProfile.data?.stats;
  const memberCount = (circleId: string) => circles.data?.members.filter((m) => m.circle_id === circleId).length ?? 0;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.titleRow}>
            <ThemedText type="subtitle" style={styles.flex}>
              {t('social.title')}
            </ThemedText>
            <Pressable
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel={t('settings.title')}
              hitSlop={8}
              style={[styles.gear, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.gearIcon}>⚙️</ThemedText>
            </Pressable>
          </View>

          {myProfile.isLoading && <ActivityIndicator color={theme.primary} />}
          {myProfile.error && (
            <ThemedText type="small" themeColor="danger">
              {t('common.error')}
            </ThemedText>
          )}
          {myProfile.isSuccess && !myProfile.data && <UsernameSetup />}

          {myProfile.data && (
            <>
              <View style={[styles.me, { backgroundColor: theme.lavenderSoft }]}>
                <SocialAvatar color={myProfile.data.color} size={64} />
                <View style={styles.flex}>
                  <ThemedText type="heading" numberOfLines={1}>
                    {myProfile.data.display_name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                    @{myProfile.data.username}
                  </ThemedText>
                  {stats?.streak !== undefined && (
                    <ThemedText type="caption" themeColor="textSecondary">
                      🔥 {t('social.friend.ownStreak', { count: stats.streak })} · 🌱 {stats.seeds}
                    </ThemedText>
                  )}
                </View>
              </View>

              <Requests requests={pending} />
              <CheersInbox cheers={cheers.data ?? []} />

              <ThemedText type="heading">{t('social.friendsTitle')}</ThemedText>
              {accepted.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('social.noFriends')}
                </ThemedText>
              ) : (
                accepted.map((f) => (
                  <FriendCard
                    key={f.user_id}
                    userId={f.user_id}
                    name={f.display_name}
                    username={f.username}
                    color={f.color}
                    profile={profileById[f.user_id]}
                    shared={days.data ? shared[f.user_id] : null}
                  />
                ))
              )}
              <AddFriend myUsername={myProfile.data.username} />

              <ThemedText type="heading">{t('social.circlesTitle')}</ThemedText>
              {circles.data?.circles.map((circle) => (
                <CircleCard key={circle.id} circle={circle} memberCount={memberCount(circle.id)} />
              ))}
              <CirclesActions />

              <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
                🔒 {t('social.privacyNote')}
              </ThemedText>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  gear: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  gearIcon: { fontSize: 22, lineHeight: 28 },
  me: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.xl,
  },
  center: { textAlign: 'center' },
});
