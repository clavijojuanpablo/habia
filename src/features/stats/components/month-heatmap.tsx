import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useHeatmapRamp, useTheme } from '@/hooks/use-theme';
import { formatLocalDate, WEEKDAYS, weekdayIndex } from '@/lib/recurrence';

import type { DayStat } from '../compute-stats';
import { ChartCard } from './chart-card';

type Props = { days: DayStat[]; today: Date };

/** Dark or light text, whichever reads better on the given hex background. */
function inkFor(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.18 ? '#0B1A12' : '#FFFFFF';
}

/** Buckets a completion ratio into one of the 5 ramp steps. */
function step(ratio: number) {
  if (ratio >= 1) return 4;
  return Math.min(3, Math.floor(ratio * 4));
}

/** Calendar heatmap of the current month: darker green = more habits completed. */
export function MonthHeatmap({ days, today }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const ramp = useHeatmapRamp();
  const [selected, setSelected] = useState<DayStat | null>(null);

  const byDate = new Map(days.map((d) => [formatLocalDate(d.date), d]));
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: weekdayIndex(first) }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(today.getFullYear(), today.getMonth(), i + 1)),
  ];

  const describe = (d: DayStat) =>
    t('progress.dayDetail', {
      date: d.date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }),
      done: d.done,
      due: d.due,
    });

  return (
    <ChartCard
      title={today.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
      subtitle={t('progress.heatmapSubtitle')}
      detail={selected ? describe(selected) : null}>
      <View style={styles.row}>
        {WEEKDAYS.map((d) => (
          <ThemedText key={d} type="small" themeColor="textSecondary" style={styles.weekday}>
            {t(`weekdays.${d}`)}
          </ThemedText>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((date, i) => {
          if (!date) return <View key={`empty-${i}`} style={styles.cell} />;
          const stat = byDate.get(formatLocalDate(date));
          const future = date > today;
          const hasDue = !!stat && stat.ratio !== null;
          const background = future || !hasDue
            ? 'transparent'
            : stat.ratio === 0
              ? theme.backgroundSelected
              : ramp[step(stat.ratio!)];
          const isSelected = selected && formatLocalDate(selected.date) === formatLocalDate(date);

          return (
            <Pressable
              key={date.getDate()}
              style={styles.cell}
              disabled={!hasDue || future}
              onPress={() => stat && setSelected(isSelected ? null : stat)}
              accessibilityLabel={stat && hasDue ? describe(stat) : undefined}>
              <View
                style={[
                  styles.square,
                  { backgroundColor: background, borderColor: isSelected ? theme.text : 'transparent' },
                  (future || !hasDue) && { borderColor: theme.border, borderStyle: 'dashed' },
                ]}>
                <ThemedText
                  type="small"
                  style={[
                    styles.dayNumber,
                    { color: hasDue && !future && stat.ratio! > 0 ? inkFor(background) : theme.textSecondary },
                  ]}>
                  {date.getDate()}
                </ThemedText>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Scale legend: sequential ramp, low → high */}
      <View style={styles.legend}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('progress.less')}
        </ThemedText>
        {[theme.backgroundSelected, ...ramp].map((c) => (
          <View key={c} style={[styles.legendSwatch, { backgroundColor: c }]} />
        ))}
        <ThemedText type="small" themeColor="textSecondary">
          {t('progress.more')}
        </ThemedText>
      </View>
    </ChartCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  weekday: { flex: 1, textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, padding: 2 },
  square: {
    flex: 1,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: { fontSize: 11, lineHeight: 14 },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  legendSwatch: { width: 12, height: 12, borderRadius: 3 },
});
