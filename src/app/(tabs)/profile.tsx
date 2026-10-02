import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useCheersInbox, useMarkCheersSeen, useMySocialProfile } from '@/features/social/api';
import { AddFriend } from '@/features/social/components/add-friend';
import { CheersInbox } from '@/features/social/components/cheers';
import { FriendRow } from '@/features/social/components/friend-row';
import { Requests } from '@/features/social/components/requests';
import { SocialAvatar } from '@/features/social/components/social-avatar';
import { UsernameSetup } from '@/features/social/components/username-setup';
import { SocialCard } from '@/features/social/components/social-card';
import { useFriends } from '@/features/social/use-friends';
import { useTheme } from '@/hooks/use-theme';

/**
 * Your profile: your card (what friends see), requests and cheers, and your friends folded into one
 * line. Circles live in their own screen (🫂 in the top bar); achievements and the character will
 * come here. Settings live behind the button.
 */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const myProfile = useMySocialProfile();
  const cheers = useCheersInbox();
  const { mutate: markSeen } = useMarkCheersSeen();

  const { friends, friendships } = useFriends();
  const [showFriends, setShowFriends] = useState(false);
  const pending = friendships.data?.filter((f) => f.status === 'pending') ?? [];

  // Looking at the profile is reading the cheers: they stop showing on Today and on the tab.
  const hasUnseen = (cheers.data ?? []).some((c) => !c.seen_at);
  useFocusEffect(
    useCallback(() => {
      if (hasUnseen) markSeen();
    }, [hasUnseen, markSeen]),
  );

  const stats = myProfile.data?.stats;

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

              <SocialCard>
                <Pressable
                  onPress={() => setShowFriends(!showFriends)}
                  disabled={friends.length === 0}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: showFriends }}
                  style={styles.friendsHeader}>
                  <ThemedText type="heading" style={styles.flex}>
                    👥{' '}
                    {friends.length === 0
                      ? t('social.noFriendsShort')
                      : t('social.friendsCount', { count: friends.length })}
                  </ThemedText>
                  {friends.length > 0 && (
                    <ThemedText type="heading" themeColor="textSecondary">
                      {showFriends ? '⌃' : '⌄'}
                    </ThemedText>
                  )}
                </Pressable>
                {showFriends &&
                  friends.map(({ friend, profile }) => (
                    <FriendRow key={friend.user_id} friend={friend} profile={profile} />
                  ))}
              </SocialCard>
              <AddFriend myUsername={myProfile.data.username} />

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
  friendsHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
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
