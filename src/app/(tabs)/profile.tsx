import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { useCheersInbox, useMySocialProfile } from '@/features/social/api';
import { AddFriend } from '@/features/social/components/add-friend';
import { Requests } from '@/features/social/components/requests';
import { SocialAvatar } from '@/features/social/components/social-avatar';
import { UsernameSetup } from '@/features/social/components/username-setup';
import { useFriends } from '@/features/social/use-friends';
import { useSocialRefresh } from '@/features/social/use-social-refresh';
import { useTheme } from '@/hooks/use-theme';

/**
 * Your profile: your card (what friends see), requests to answer, and two doors side by side —
 * cheers and friends — that open as their own sheets, so long lists never stretch this page.
 * Circles live in their own screen (🫂 in the top bar). Settings live behind the button.
 */
export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const myProfile = useMySocialProfile();
  const cheers = useCheersInbox();
  const unseenCheers = (cheers.data ?? []).filter((c) => !c.seen_at).length;
  const { friends, friendships } = useFriends();
  const pending = friendships.data?.filter((f) => f.status === 'pending') ?? [];
  const { refreshing, onRefresh } = useSocialRefresh();

  const stats = myProfile.data?.stats;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
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
              <View style={styles.doors}>
                <Door
                  icon="💌"
                  label={t('social.cheer.door')}
                  count={(cheers.data ?? []).length}
                  badge={unseenCheers}
                  onPress={() => router.push('/cheers')}
                />
                <Door
                  icon="👥"
                  label={t('social.friendsDoor')}
                  count={friends.length}
                  badge={0}
                  onPress={() => router.push('/friends')}
                />
              </View>
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

/** A big tappable tile: icon, label and count; a dot with the number of new things. */
function Door({
  icon,
  label,
  count,
  badge,
  onPress,
}: {
  icon: string;
  label: string;
  count: number;
  badge: number;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label} (${count})`}
      style={({ pressed }) => [
        styles.door,
        { backgroundColor: theme.backgroundElement, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}>
      <ThemedText style={styles.doorIcon}>{icon}</ThemedText>
      <ThemedText type="heading" numberOfLines={1}>
        {label} ({count})
      </ThemedText>
      {badge > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.danger }]}>
          <ThemedText type="caption" style={{ color: theme.onPrimary }}>
            {badge}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  doors: { flexDirection: 'row', gap: Spacing.three },
  door: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    boxShadow: Shadow.card,
  },
  doorIcon: { fontSize: 30, lineHeight: 36 },
  badge: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: Spacing.one,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
