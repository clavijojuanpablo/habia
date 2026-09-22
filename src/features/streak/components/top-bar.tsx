import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useGarden } from '@/features/garden/use-garden';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';

import { useStreak } from '../use-streak';

export const STAGE_EMOJI = ['🌰', '🌱', '🌿', '🌳', '🍎'];

/**
 * Duolingo-style status bar: streak, votes and tree stage at a glance.
 * The flame stays grey until you complete a habit today.
 */
export function TopBar() {
  const { t } = useTranslation();
  const now = useNow();
  const { today } = useTodayRange(now);
  const { streak } = useStreak(today);
  const { summary } = useGarden(today, now);

  return (
    <View style={styles.bar}>
      <Counter
        emoji="🔥"
        value={streak.current}
        color="streak"
        dimmed={!streak.todayDone}
        label={t('topBar.streak', { count: streak.current })}
        onPress={() => router.push('/streak')}
      />
      <Counter
        emoji="🌱"
        value={summary.votes}
        color="primary"
        label={t('topBar.votes', { count: summary.votes })}
        onPress={() => router.push('/garden')}
      />
      <Counter
        emoji={STAGE_EMOJI[summary.stage]}
        value={null}
        text={t(`garden.stageShort.${summary.stage}`)}
        color="lavender"
        label={t(`garden.stage.${summary.stage}`)}
        onPress={() => router.push('/garden')}
      />
    </View>
  );
}

function Counter({
  emoji,
  value,
  text,
  color,
  dimmed,
  label,
  onPress,
}: {
  emoji: string;
  value: number | null;
  text?: string;
  color: ThemeColor;
  dimmed?: boolean;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      style={({ pressed }) => [styles.counter, { transform: [{ scale: pressed ? 0.94 : 1 }] }]}>
      <ThemedText style={[styles.emoji, dimmed && styles.dimmed]}>{emoji}</ThemedText>
      <ThemedText type="heading" style={{ color: dimmed ? theme.textSecondary : theme[color] }}>
        {value ?? text}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
  },
  emoji: { fontSize: 24, lineHeight: 30 },
  dimmed: { opacity: 0.35 },
});
