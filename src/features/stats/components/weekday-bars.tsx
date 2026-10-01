import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEEKDAYS } from '@/lib/recurrence';

import type { Ratio } from '../compute-stats';
import { ChartCard } from './chart-card';

const CHART_HEIGHT = 110;
/** About three weeks of a daily habit: below that a weekday's rate says little. */
const MIN_DUE = 3;
/** Only call out a strong and a hard day when they really differ. */
const MIN_GAP_POINTS = 15;

const percent = (ratio: number) => Math.round(ratio * 100);

/**
 * Completion per weekday over the last 8 weeks. The strongest and hardest days are named
 * (a pattern to plan around, never a verdict); the rest stay quiet.
 */
export function WeekdayBars({ weekdays }: { weekdays: Ratio[] }) {
  const { t } = useTranslation();
  const theme = useTheme();

  const measured = weekdays.flatMap((w, i) => (w.ratio !== null && w.due >= MIN_DUE ? [{ i, ratio: w.ratio }] : []));
  if (measured.length < 3) return null;
  const best = measured.reduce((a, b) => (b.ratio > a.ratio ? b : a));
  const hardest = measured.reduce((a, b) => (b.ratio < a.ratio ? b : a));
  const contrast = percent(best.ratio) - percent(hardest.ratio) >= MIN_GAP_POINTS;
  const dayName = (i: number) => t(`weekdaysLong.${WEEKDAYS[i]}`);

  return (
    <ChartCard
      title={t('progress.weekdaysTitle')}
      subtitle={
        contrast
          ? t('progress.weekdaysInsight', {
              best: dayName(best.i),
              bestPercent: percent(best.ratio),
              hardest: dayName(hardest.i),
              hardestPercent: percent(hardest.ratio),
            })
          : t('progress.weekdaysEven')
      }>
      <View style={styles.plot}>
        {weekdays.map((w, i) => {
          const shown = w.ratio !== null && w.due >= MIN_DUE;
          const highlighted = contrast && (i === best.i || i === hardest.i);
          return (
            <View key={WEEKDAYS[i]} style={styles.column} accessible accessibilityLabel={shown ? `${dayName(i)}: ${percent(w.ratio!)}%` : dayName(i)}>
              <ThemedText type="caption" themeColor={highlighted ? 'text' : 'textSecondary'}>
                {shown ? `${percent(w.ratio!)}%` : ''}
              </ThemedText>
              <View style={[styles.track, { backgroundColor: theme.background }]}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: shown ? Math.max(4, w.ratio! * CHART_HEIGHT) : 0,
                      backgroundColor: contrast && i === hardest.i ? theme.streak : theme.primary,
                      opacity: !contrast || highlighted ? 1 : 0.45,
                    },
                  ]}
                />
              </View>
              <ThemedText type="small" themeColor={highlighted ? 'text' : 'textSecondary'}>
                {t(`weekdays.${WEEKDAYS[i]}`)}
              </ThemedText>
            </View>
          );
        })}
      </View>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  plot: { flexDirection: 'row', gap: Spacing.one, alignItems: 'flex-end' },
  column: { flex: 1, alignItems: 'center', gap: Spacing.one },
  track: { width: '70%', height: CHART_HEIGHT, borderRadius: Radius.sm, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: Radius.sm },
});
