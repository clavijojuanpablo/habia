import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useHeatmapRamp, useTheme } from '@/hooks/use-theme';
import { formatLocalDate, WEEKDAYS, weekdayIndex } from '@/lib/recurrence';

import { useMonthDays } from '../use-month-days';
import { ChartCard } from './chart-card';

type Props = {
  today: Date;
  /** No browsing before the account existed. */
  joinedOn: Date | null;
};

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

const monthIndex = (d: Date) => d.getFullYear() * 12 + d.getMonth();

/** Calendar heatmap, one month at a time: darker green = more habits completed that day. */
export function MonthHeatmap({ today, joinedOn }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const ramp = useHeatmapRamp();
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const { days, isLoading, error } = useMonthDays(month, today);
  // The date, not the DayStat: a refetch replaces the stat and the detail must follow.
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const canGoBack = !joinedOn || monthIndex(month) > monthIndex(joinedOn);
  const canGoForward = monthIndex(month) < monthIndex(today);
  const go = (delta: number) => {
    setMonth(new Date(month.getFullYear(), month.getMonth() + delta, 1));
    setSelectedKey(null);
  };

  const byDate = new Map(days.map((d) => [formatLocalDate(d.date), d]));
  const selected = selectedKey ? (byDate.get(selectedKey) ?? null) : null;
  const todayKey = formatLocalDate(today);
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array.from({ length: weekdayIndex(month) }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1)),
  ];

  const describe = (d: { date: Date; done: number; due: number }) =>
    t('progress.dayDetail', {
      date: d.date.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }),
      done: d.done,
      due: d.due,
    });

  return (
    <ChartCard
      title={t('progress.calendarTitle')}
      subtitle={t('progress.heatmapSubtitle')}
      detail={selected ? describe(selected) : null}>
      <View style={styles.nav}>
        <Arrow label="‹" enabled={canGoBack} onPress={() => go(-1)} a11y={t('progress.previousMonth')} />
        <View style={styles.monthLabel}>
          <ThemedText type="smallBold" style={styles.capitalize}>
            {month.toLocaleDateString(i18n.language, { month: 'long', year: 'numeric' })}
          </ThemedText>
          {isLoading && <ActivityIndicator size="small" color={theme.primary} />}
        </View>
        <Arrow label="›" enabled={canGoForward} onPress={() => go(1)} a11y={t('progress.nextMonth')} />
      </View>
      {/* Offline on an old month: say so, instead of an empty calendar that reads as "did nothing". */}
      {error && (
        <ThemedText type="small" themeColor="danger">
          {t('common.error')}
        </ThemedText>
      )}
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
          const key = formatLocalDate(date);
          const stat = byDate.get(key);
          const future = date > today;
          const hasDue = !!stat && stat.ratio !== null;
          // Today with nothing done yet is pending, not missed: never paint it as a failed day.
          const pendingToday = key === todayKey && hasDue && stat.done === 0;
          const background =
            future || !hasDue || pendingToday
              ? 'transparent'
              : stat.ratio === 0
                ? theme.backgroundSelected
                : ramp[step(stat.ratio!)];
          const isSelected = selectedKey === key;
          const painted = hasDue && !future && !pendingToday && stat.ratio! > 0;

          return (
            <Pressable
              key={key}
              style={styles.cell}
              disabled={!hasDue || future}
              onPress={() => setSelectedKey(isSelected ? null : key)}
              accessibilityLabel={stat && hasDue ? describe(stat) : undefined}>
              <View
                style={[
                  styles.square,
                  { backgroundColor: background, borderColor: isSelected ? theme.text : 'transparent' },
                  (future || !hasDue) && { borderColor: theme.border, borderStyle: 'dashed' },
                  pendingToday && !isSelected && { borderColor: theme.primary, borderStyle: 'dashed' },
                ]}>
                <ThemedText
                  type="small"
                  style={[styles.dayNumber, { color: painted ? inkFor(background) : theme.textSecondary }]}>
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

function Arrow({ label, enabled, onPress, a11y }: { label: string; enabled: boolean; onPress: () => void; a11y: string }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!enabled}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={a11y}
      style={[styles.arrow, { backgroundColor: theme.background, opacity: enabled ? 1 : 0.3 }]}>
      <ThemedText type="heading">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  monthLabel: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  capitalize: { textTransform: 'capitalize' },
  arrow: { width: 36, height: 36, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
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
