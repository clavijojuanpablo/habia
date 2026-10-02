import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { Friendship, SocialProfile } from '../api';
import { SocialAvatar } from './social-avatar';

/** One friend in a list: who, and their own streak. Tapping opens their profile. */
export function FriendRow({ friend, profile }: { friend: Friendship; profile: SocialProfile | undefined }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const streak = profile?.stats.streak;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/friend/[id]', params: { id: friend.user_id } })}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <SocialAvatar color={friend.color} size={40} />
      <View style={styles.flex}>
        <ThemedText type="smallBold" numberOfLines={1}>
          {friend.display_name}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          @{friend.username}
          {streak !== undefined && ` · 🔥 ${t('social.friend.ownStreak', { count: streak })}`}
        </ThemedText>
      </View>
      <ThemedText type="heading" style={{ color: theme.textSecondary }}>
        ›
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
});
