import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { AUTOMATICITY_REPETITIONS } from '@/features/garden/compute-garden';
import { useTheme } from '@/hooks/use-theme';
import { parseLocalDate } from '@/lib/recurrence';

import type { Highlight } from '../highlights';
import { ChartCard } from './chart-card';

const LOOK: Record<Highlight['kind'], { emoji: string; tint: ThemeColor }> = {
  steady: { emoji: '🏆', tint: 'streakSoft' },
  rising: { emoji: '🚀', tint: 'lavenderSoft' },
  next_fruit: { emoji: '🍎', tint: 'primarySoft' },
  care: { emoji: '🤝', tint: 'lavenderSoft' },
};

/**
 * "Tus hábitos destacados": one card, one row per highlight, each read as a sentence
 * (what it means, which habit, the number behind it), in the same style as the charts.
 */
export function HighlightCards({ highlights }: { highlights: Highlight[] }) {
  const { t } = useTranslation();
  if (highlights.length === 0) return null;
  return (
    <ChartCard title={t('progress.highlightsTitle')} subtitle={t('progress.highlightsSubtitle')}>
      <View style={styles.list}>
        {highlights.map((h, i) => (
          <HighlightRow key={h.kind} highlight={h} last={i === highlights.length - 1} />
        ))}
      </View>
    </ChartCard>
  );
}

function HighlightRow({ highlight: h, last }: { highlight: Highlight; last: boolean }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { emoji, tint } = LOOK[h.kind];

  const sentence =
    h.kind === 'steady'
      ? t('progress.highlights.steadyValue', { percent: h.percent })
      : h.kind === 'rising'
        ? t('progress.highlights.risingValue', { from: h.from, to: h.to })
        : h.kind === 'next_fruit'
          ? t('progress.highlights.nextFruitValue', {
              count: h.completions,
              total: AUTOMATICITY_REPETITIONS,
              date: parseLocalDate(h.eta).toLocaleDateString(i18n.language, { day: 'numeric', month: 'long' }),
            })
          : t('progress.highlights.careValue', { percent: h.percent });

  return (
    <View style={[styles.row, !last && { borderBottomColor: theme.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.badge, { backgroundColor: theme[tint] }]}>
        <ThemedText style={styles.emoji}>{emoji}</ThemedText>
      </View>
      <View style={styles.texts}>
        <ThemedText type="caption" themeColor="textSecondary">
          {t(`progress.highlights.${h.kind}`)}
        </ThemedText>
        <ThemedText type="smallBold">
          {h.icon} {h.name}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {sentence}
        </ThemedText>
        {h.kind === 'care' && (
          <Pressable
            onPress={() => router.push({ pathname: '/habit/[id]', params: { id: h.habitId } })}
            hitSlop={8}
            accessibilityRole="button">
            <ThemedText type="smallBold" style={{ color: theme.primary }}>
              {t(h.hasMinimum ? 'progress.highlights.careOpen' : 'progress.highlights.careEasier')} ›
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.three, paddingBottom: Spacing.two },
  badge: { width: 40, height: 40, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20, lineHeight: 26 },
  texts: { flex: 1, gap: Spacing.half },
});
