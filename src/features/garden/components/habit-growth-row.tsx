import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { AUTOMATICITY_REPETITIONS, type HabitGrowth } from '../compute-garden';

export function HabitGrowthRow({ growth }: { growth: HabitGrowth }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const color = growth.habit.color ?? theme.primary;
  const repetitions = Math.min(growth.completions, AUTOMATICITY_REPETITIONS);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.emoji}>{growth.habit.icon}</ThemedText>
        <View style={styles.flex}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {growth.habit.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('garden.streak', { count: growth.streak })} ·{' '}
            {t('garden.consistency', { percent: Math.round(growth.consistency * 100) })}
          </ThemedText>
        </View>
        {growth.automaticity >= 1 && <ThemedText style={styles.emoji}>🍎</ThemedText>}
      </View>

      {/* Honest progress toward automaticity (~66 repetitions, not "21 days") */}
      <View style={[styles.track, { backgroundColor: theme.background }]}>
        <View style={[styles.fill, { width: `${growth.automaticity * 100}%`, backgroundColor: color }]} />
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {t('garden.automaticity', { count: repetitions, total: AUTOMATICITY_REPETITIONS })}
      </ThemedText>

      {growth.atRisk && (
        <ThemedText type="small" style={{ color }}>
          {t('garden.neverMissTwice')}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.two },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
  emoji: { fontSize: 24, lineHeight: 30 },
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});
