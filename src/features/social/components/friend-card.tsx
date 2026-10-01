import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { SocialProfile } from '../api';
import type { SharedDayState, SharedStreak } from '../shared-days';
import { SocialAvatar } from './social-avatar';
import { WeekDots, type DotState } from './week-dots';

export const sharedDot: Record<SharedDayState, DotState> = {
  both: 'full',
  one: 'half',
  none: 'empty',
  rest: 'rest',
  pending: 'pending',
  future: 'future',
};

/** A friend at a glance: who, the streak you grow together and this week's shared days. */
export function FriendCard({
  name,
  username,
  color,
  userId,
  profile,
  shared,
}: {
  name: string;
  username: string;
  color: string;
  userId: string;
  profile: SocialProfile | undefined;
  shared: SharedStreak | null;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const streak = profile?.stats.streak;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/friend/[id]', params: { id: userId } })}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <View style={styles.row}>
        <SocialAvatar color={color} />
        <View style={styles.flex}>
          <ThemedText type="heading" numberOfLines={1}>
            {name}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
            @{username}
            {streak !== undefined && ` · 🔥 ${t('social.friend.ownStreak', { count: streak })}`}
          </ThemedText>
        </View>
        {shared && (
          <View style={[styles.together, { backgroundColor: theme.streakSoft }]}>
            <ThemedText type="heading">
              🔥 {shared.current}
              {shared.capped ? '+' : ''}
            </ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('social.friend.together')}
            </ThemedText>
          </View>
        )}
      </View>
      {shared && <WeekDots states={shared.week.map((d) => sharedDot[d.state])} size={16} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three, boxShadow: Shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
  together: {
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
});
