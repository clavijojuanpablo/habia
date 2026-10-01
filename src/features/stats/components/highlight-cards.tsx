import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ProgressRing } from '@/components/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Shadow, Spacing, type ThemeColor } from '@/constants/theme';
import { AUTOMATICITY_REPETITIONS } from '@/features/garden/compute-garden';
import { useTheme } from '@/hooks/use-theme';
import { parseLocalDate } from '@/lib/recurrence';

import type { Highlight } from '../highlights';

const LOOK: Record<Highlight['kind'], { emoji: string; tint: ThemeColor; accent: ThemeColor }> = {
  steady: { emoji: '🏆', tint: 'streakSoft', accent: 'primary' },
  rising: { emoji: '🚀', tint: 'lavenderSoft', accent: 'primary' },
  next_fruit: { emoji: '🍎', tint: 'primarySoft', accent: 'primary' },
  care: { emoji: '🤝', tint: 'lavenderSoft', accent: 'streak' },
};

/**
 * Standout habits as visual cards, two per row: a colored band says what the card means, a small
 * chart says the number at a glance (ring, before → after, road to the fruit), and a tap opens the
 * analysis in words.
 */
export function HighlightCards({ highlights }: { highlights: Highlight[] }) {
  if (highlights.length === 0) return null;
  return (
    <View style={styles.grid}>
      {highlights.map((h) => (
        <HighlightCard key={h.kind} highlight={h} />
      ))}
    </View>
  );
}

function HighlightCard({ highlight: h }: { highlight: Highlight }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const { emoji, tint, accent } = LOOK[h.kind];
  const color = theme[accent];

  const analysis =
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
    <Pressable
      onPress={() => setOpen(!open)}
      accessibilityRole="button"
      accessibilityState={{ expanded: open }}
      accessibilityLabel={`${t(`progress.highlights.${h.kind}`)}: ${h.name}. ${analysis}`}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <View style={[styles.band, { backgroundColor: theme[tint] }]}>
        <ThemedText style={styles.bandEmoji}>{emoji}</ThemedText>
        <ThemedText type="smallBold" numberOfLines={2} style={styles.flex}>
          {t(`progress.highlights.${h.kind}`)}
        </ThemedText>
      </View>

      <View style={styles.body}>
        <View style={styles.visual}>
          {(h.kind === 'steady' || h.kind === 'care') && (
            <ProgressRing progress={h.percent / 100} size={76} stroke={8} color={color} track={theme.backgroundSelected}>
              <ThemedText style={[styles.big, { color }]}>{h.percent}%</ThemedText>
            </ProgressRing>
          )}
          {h.kind === 'rising' && (
            <View style={styles.rise}>
              <Bar ratio={h.from / 100} label={`${h.from}%`} color={theme.textSecondary} track={theme.backgroundSelected} />
              <ThemedText style={[styles.arrow, { color }]}>➜</ThemedText>
              <Bar ratio={h.to / 100} label={`${h.to}%`} color={color} track={theme.backgroundSelected} />
            </View>
          )}
          {h.kind === 'next_fruit' && (
            <View style={styles.road}>
              <ThemedText style={[styles.big, { color }]}>
                {h.completions}
                <ThemedText type="smallBold" themeColor="textSecondary">
                  {` / ${AUTOMATICITY_REPETITIONS}`}
                </ThemedText>
              </ThemedText>
              <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                <View
                  style={[
                    styles.fill,
                    { backgroundColor: color, width: `${(h.completions / AUTOMATICITY_REPETITIONS) * 100}%` },
                  ]}
                />
              </View>
            </View>
          )}
        </View>

        <ThemedText type="smallBold" numberOfLines={1} style={styles.center}>
          {h.icon} {h.name}
        </ThemedText>

        {open ? (
          <View style={styles.analysis}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              {analysis}
            </ThemedText>
            {h.kind === 'care' && (
              <Pressable
                onPress={() => router.push({ pathname: '/habit/[id]', params: { id: h.habitId } })}
                hitSlop={8}
                accessibilityRole="button">
                <ThemedText type="smallBold" style={[styles.center, { color: theme.primary }]}>
                  {t(h.hasMinimum ? 'progress.highlights.careOpen' : 'progress.highlights.careEasier')} ›
                </ThemedText>
              </Pressable>
            )}
          </View>
        ) : (
          <ThemedText type="caption" style={[styles.center, { color: theme.primary }]}>
            {t('progress.highlights.seeAnalysis')} ›
          </ThemedText>
        )}
      </View>
    </Pressable>
  );
}

/** One vertical bar with its value on top: two of them read as "before → after". */
function Bar({ ratio, label, color, track }: { ratio: number; label: string; color: string; track: string }) {
  return (
    <View style={styles.barColumn}>
      <ThemedText type="smallBold" style={{ color }}>
        {label}
      </ThemedText>
      <View style={[styles.barTrack, { backgroundColor: track }]}>
        <View style={[styles.barFill, { backgroundColor: color, height: `${Math.max(6, ratio * 100)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  card: { flexGrow: 1, flexBasis: '45%', borderRadius: Radius.lg, overflow: 'hidden', boxShadow: Shadow.card },
  band: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, padding: Spacing.two, paddingHorizontal: Spacing.three },
  bandEmoji: { fontSize: 18, lineHeight: 24 },
  flex: { flex: 1 },
  body: { padding: Spacing.three, gap: Spacing.two, alignItems: 'stretch' },
  visual: { height: 84, alignItems: 'center', justifyContent: 'center' },
  big: { fontSize: 20, lineHeight: 26, fontFamily: FontFamily.black },
  rise: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  arrow: { fontSize: 18, lineHeight: 24, paddingBottom: Spacing.three },
  barColumn: { alignItems: 'center', gap: Spacing.half },
  barTrack: { width: 22, height: 60, borderRadius: Radius.sm, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', borderRadius: Radius.sm },
  road: { width: '100%', alignItems: 'center', gap: Spacing.two },
  track: { width: '100%', height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  center: { textAlign: 'center' },
  analysis: { gap: Spacing.two },
});
