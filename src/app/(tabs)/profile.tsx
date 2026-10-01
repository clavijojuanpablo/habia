import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useCheersInbox, useCircles, useMarkCheersSeen, useMySocialProfile } from '@/features/social/api';
import { AddFriend } from '@/features/social/components/add-friend';
import { CheersInbox } from '@/features/social/components/cheers';
import { CircleCard, CirclesActions } from '@/features/social/components/circles';
import { FriendCard } from '@/features/social/components/friend-card';
import { Requests } from '@/features/social/components/requests';
import { SocialAvatar } from '@/features/social/components/social-avatar';
import { UsernameSetup } from '@/features/social/components/username-setup';
import { useSharedStreaks } from '@/features/social/use-shared-streaks';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';

/**
 * Your profile: your card first (what friends see), then requests, cheers,
 * friends with the streak you grow together, and circles. Settings live behind the gear.
 */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const { today } = useTodayRange(now);

  const myProfile = useMySocialProfile();
  const circles = useCircles();
  const cheers = useCheersInbox();
  const { mutate: markSeen } = useMarkCheersSeen();

  const { friends, friendships } = useSharedStreaks(today);
  const pending = friendships.data?.filter((f) => f.status === 'pending') ?? [];

  // Looking at the profile is reading the cheers: they stop showing on Today and on the tab.
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
              hitSlop={8}
              style={({ pressed }) => [
                styles.settings,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  borderBottomWidth: pressed ? 2 : 4,
                  marginTop: pressed ? 2 : 0,
                },
              ]}>
              <ThemedText type="smallBold">⚙️ {t('settings.title')}</ThemedText>
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
              {friends.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {t('social.noFriends')}
                </ThemedText>
              ) : (
                friends.map(({ friend, profile, shared }) => (
                  <FriendCard
                    key={friend.user_id}
                    userId={friend.user_id}
                    name={friend.display_name}
                    username={friend.username}
                    color={friend.color}
                    profile={profile}
                    shared={shared}
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
  settings: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 2,
  },
  me: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.xl,
  },
  center: { textAlign: 'center' },
});
