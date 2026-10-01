import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing, type ThemeColor } from '@/constants/theme';
import { AUTOMATICITY_REPETITIONS } from '@/features/garden/compute-garden';
import { useTheme } from '@/hooks/use-theme';
import { parseLocalDate } from '@/lib/recurrence';

import type { Highlight } from '../highlights';

const LOOK: Record<Highlight['kind'], { emoji: string; tint: ThemeColor }> = {
  steady: { emoji: '🏆', tint: 'streakSoft' },
  rising: { emoji: '🚀', tint: 'lavenderSoft' },
  next_fruit: { emoji: '🍎', tint: 'primarySoft' },
  care: { emoji: '💧', tint: 'lavenderSoft' },
};

/** "Tus hábitos destacados": one small card per highlight, two per row. */
export function HighlightCards({ highlights }: { highlights: Highlight[] }) {
  const { t } = useTranslation();
  if (highlights.length === 0) return null;
  return (
    <View style={styles.section}>
      <ThemedText type="heading">{t('progress.highlightsTitle')}</ThemedText>
      <View style={styles.grid}>
        {highlights.map((h) => (
          <HighlightCard key={h.kind} highlight={h} />
        ))}
      </View>
    </View>
  );
}

function HighlightCard({ highlight: h }: { highlight: Highlight }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { emoji, tint } = LOOK[h.kind];

  const value =
    h.kind === 'steady'
      ? t('progress.highlights.steadyValue', { percent: h.percent })
      : h.kind === 'rising'
        ? t('progress.highlights.risingValue', { from: h.from, to: h.to })
        : h.kind === 'next_fruit'
          ? t('progress.highlights.nextFruitValue', {
              count: h.completions,
              total: AUTOMATICITY_REPETITIONS,
              date: parseLocalDate(h.eta).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }),
            })
          : t('progress.highlights.careValue', { percent: h.percent });

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: theme[tint] }]}>
          <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        </View>
        <ThemedText type="caption" themeColor="textSecondary" style={styles.flex}>
          {t(`progress.highlights.${h.kind}`)}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" numberOfLines={1}>
        {h.icon} {h.name}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {value}
      </ThemedText>
      {h.kind === 'care' && (
        <Pressable
          onPress={() => router.push({ pathname: '/habit/[id]', params: { id: h.habitId } })}
          hitSlop={8}
          accessibilityRole="button">
          <ThemedText type="caption" style={{ color: theme.primary }}>
            {t(h.hasMinimum ? 'progress.highlights.careOpen' : 'progress.highlights.careEasier')}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  card: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
    boxShadow: Shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: { width: 28, height: 28, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 15, lineHeight: 20 },
  flex: { flex: 1 },
});
