import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useBandColors, useTheme } from '@/hooks/use-theme';

import type { BandStat } from '../compute-stats';
import { ChartCard } from './chart-card';

/**
 * Completion rate per day band. Each bar keeps the band's identity color used
 * everywhere in the app, and is labeled directly (never color alone).
 */
export function BandBars({ bands }: { bands: BandStat[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const bandColors = useBandColors();

  // "Any time" has no moment to re-anchor, so it is left out of the insight.
  const ranked = bands.filter((b) => b.ratio !== null && b.band !== 'anytime');
  const worst = ranked.length > 1 ? ranked.reduce((a, b) => (b.ratio! < a.ratio! ? b : a)) : null;
  const best = ranked.length > 1 ? ranked.reduce((a, b) => (b.ratio! > a.ratio! ? b : a)) : null;
  // Only suggest a change when the gap is meaningful (≥ 15 points).
  const insight = worst && best && best.ratio! - worst.ratio! >= 0.15 ? worst : null;

  return (
    <ChartCard
      title={t('progress.bandsTitle')}
      subtitle={insight ? t('progress.bandsInsight', { band: t(`bands.${insight.band}`).toLowerCase() }) : undefined}>
      {bands.map((b) => (
        <View
          key={b.band}
          style={styles.row}
          accessible
          accessibilityLabel={`${t(`bands.${b.band}`)}: ${Math.round((b.ratio ?? 0) * 100)}%`}>
          <ThemedText type="small" style={styles.label}>
            {t(`bands.${b.band}`)}
          </ThemedText>
          <View style={[styles.track, { backgroundColor: theme.background }]}>
            <View
              style={[
                styles.fill,
                { width: `${(b.ratio ?? 0) * 100}%`, backgroundColor: bandColors[b.band].accent },
              ]}
            />
          </View>
          <ThemedText type="smallBold" style={styles.value}>
            {Math.round((b.ratio ?? 0) * 100)}%
          </ThemedText>
        </View>
      ))}
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  label: { width: 96 },
  track: { flex: 1, height: 12, borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  value: { width: 44, textAlign: 'right' },
});
