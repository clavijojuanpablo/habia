import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

import type { WeekStat } from '../compute-stats';
import { ChartCard } from './chart-card';

const CHART_HEIGHT = 120;

const percent = (ratio: number | null) => (ratio === null ? '–' : `${Math.round(ratio * 100)}%`);

/** Weekly consistency trend: one series, one color, current week last. */
export function WeeklyColumns({ weeks }: { weeks: WeekStat[] }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [selected, setSelected] = useState<number | null>(null);
  const current = weeks[weeks.length - 1];

  const label = (w: WeekStat) => w.weekStart.toLocaleDateString(i18n.language, { day: 'numeric', month: 'numeric' });
  const describe = (w: WeekStat) => t('progress.weekDetail', { week: label(w), done: w.done, due: w.due, percent: percent(w.ratio) });

  return (
    <ChartCard
      title={t('progress.weeklyTitle')}
      subtitle={t('progress.weeklySubtitle', { percent: percent(current.ratio) })}
      detail={selected !== null ? describe(weeks[selected]) : null}>
      <View style={styles.plot}>
        {/* Recessive baseline and 50% guide */}
        <View style={[styles.guide, { bottom: CHART_HEIGHT / 2, borderColor: theme.border }]} />
        <View style={[styles.guide, { bottom: 0, borderColor: theme.textSecondary }]} />
        {weeks.map((w, i) => {
          const isSelected = selected === i;
          const isCurrent = i === weeks.length - 1;
          return (
            <Pressable
              key={i}
              style={styles.column}
              disabled={w.ratio === null}
              onPress={() => setSelected(isSelected ? null : i)}
              accessibilityLabel={describe(w)}>
              {isCurrent && w.ratio !== null && (
                <ThemedText type="smallBold" style={styles.directLabel}>
                  {percent(w.ratio)}
                </ThemedText>
              )}
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(2, (w.ratio ?? 0) * CHART_HEIGHT),
                    backgroundColor: w.ratio === null ? 'transparent' : theme.primary,
                    opacity: selected === null || isSelected ? 1 : 0.45,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.labels}>
        {weeks.map((w, i) => (
          <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.label}>
            {label(w)}
          </ThemedText>
        ))}
      </View>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  plot: { height: CHART_HEIGHT + 20, flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  guide: { position: 'absolute', left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth },
  column: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center' },
  bar: { width: '70%', borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  directLabel: { marginBottom: 2 },
  labels: { flexDirection: 'row', gap: 6 },
  label: { flex: 1, textAlign: 'center', fontSize: 10 },
});
