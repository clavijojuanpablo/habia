import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { BandEmoji, FontFamily, Spacing, type BandKey } from '@/constants/theme';
import { useBandColors, useTheme } from '@/hooks/use-theme';
import { addDays, daysBetween, WEEKDAYS } from '@/lib/recurrence';
import { visibleHourSegments, type DayBandConfig } from '@/lib/time/day-bands';

import { isDone, type ScheduledItem } from '../build-schedule';

const ROW_MIN_HEIGHT = 46;
/** Hours without habits collapse: order and band matter more than an exact time scale. */
const EMPTY_ROW_HEIGHT = 24;
const GUTTER = 36;

type Props = {
  weekStart: Date;
  items: ScheduledItem[];
  bands: DayBandConfig;
  now: Date;
  onToggle: (item: ScheduledItem) => void;
};

const hh = (hour: number) => String(hour % 24).padStart(2, '0');

export function WeekGrid({ weekStart, items, bands, now, onToggle }: Props) {
  const { t } = useTranslation();
  const days = WEEKDAYS.map((_, i) => addDays(weekStart, i));
  const todayIndex = daysBetween(weekStart, now);

  const byDay = days.map((_, i) => items.filter((item) => daysBetween(weekStart, item.at) === i));
  const anytime = byDay.map((list) => list.filter((item) => !item.displayHasTime));
  const timedHours = items.filter((i) => i.displayHasTime).map((i) => i.displayAt.getHours());
  // Only the hours of your day (morning start → end of night), stretched if a habit falls outside.
  const segments = visibleHourSegments(bands, timedHours);

  const cellsFor = (hour: number | null) =>
    byDay.map((list, i) =>
      hour === null ? anytime[i] : list.filter((it) => it.displayHasTime && it.displayAt.getHours() === hour),
    );

  return (
    <View style={styles.container}>
      <DayHeader days={days} todayIndex={todayIndex} />

      <ScrollView contentContainerStyle={styles.scroll}>
        {anytime.some((list) => list.length > 0) && (
          <BandCard band="anytime" title={t('week.allDay')}>
            <HourRow label={null} cells={cellsFor(null)} todayIndex={todayIndex} onToggle={onToggle} />
          </BandCard>
        )}

        {segments.map((segment) => (
          <BandCard
            key={`${segment.band}-${segment.hours[0]}`}
            band={segment.band}
            title={t(`bands.${segment.band}`)}
            range={t('week.range', { from: hh(segment.hours[0]), to: hh(segment.hours[segment.hours.length - 1] + 1) })}>
            {segment.hours.map((hour, index) => (
              <HourRow
                key={hour}
                label={hh(hour)}
                cells={cellsFor(hour)}
                todayIndex={todayIndex}
                separator={index > 0}
                nowMinutes={now.getHours() === hour ? now.getMinutes() : null}
                onToggle={onToggle}
              />
            ))}
          </BandCard>
        ))}
      </ScrollView>
    </View>
  );
}

function DayHeader({ days, todayIndex }: { days: Date[]; todayIndex: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <View style={{ width: GUTTER }} />
      {days.map((day, i) => {
        const isToday = i === todayIndex;
        const weekend = i >= 5;
        return (
          <View
            key={i}
            style={[styles.dayPill, isToday && { backgroundColor: theme.primary }]}
            accessibilityLabel={day.toDateString()}>
            <ThemedText
              type="small"
              style={[styles.dayLetter, { color: isToday ? theme.onPrimary : weekend ? theme.textSecondary : theme.text }]}>
              {t(`weekdays.${WEEKDAYS[i]}`)}
            </ThemedText>
            <ThemedText type="smallBold" style={{ color: isToday ? theme.onPrimary : theme.text }}>
              {day.getDate()}
            </ThemedText>
          </View>
        );
      })}
    </View>
  );
}

function BandCard({
  band,
  title,
  range,
  children,
}: {
  band: BandKey;
  title: string;
  range?: string;
  children: React.ReactNode;
}) {
  const colors = useBandColors()[band];
  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      <View style={styles.cardHeader}>
        <ThemedText type="smallBold" style={{ color: colors.accent }}>
          {BandEmoji[band]} {title}
        </ThemedText>
        {range && (
          <ThemedText type="small" style={{ color: colors.accent, opacity: 0.7 }}>
            {range}
          </ThemedText>
        )}
      </View>
      {children}
    </View>
  );
}

function HourRow({
  label,
  cells,
  todayIndex,
  separator = false,
  nowMinutes = null,
  onToggle,
}: {
  label: string | null;
  cells: ScheduledItem[][];
  todayIndex: number;
  separator?: boolean;
  nowMinutes?: number | null;
  onToggle: (item: ScheduledItem) => void;
}) {
  const theme = useTheme();
  const rowHeight = cells.some((list) => list.length > 0) ? ROW_MIN_HEIGHT : EMPTY_ROW_HEIGHT;
  return (
    <View style={[styles.row, { minHeight: rowHeight }]}>
      <View style={[styles.gutter, { width: GUTTER }]}>
        {label && (
          <ThemedText type="small" themeColor="textSecondary" style={styles.hourLabel}>
            {label}
          </ThemedText>
        )}
      </View>
      {cells.map((list, i) => {
        const isToday = i === todayIndex;
        return (
          <View
            key={i}
            style={[
              styles.cell,
              isToday && { backgroundColor: theme.todayColumn },
              separator && { borderTopColor: theme.text + '0F', borderTopWidth: StyleSheet.hairlineWidth },
            ]}>
            {list.map((item) => (
              <HabitChip key={item.key} item={item} onPress={onToggle} />
            ))}
            {isToday && nowMinutes !== null && (
              <View pointerEvents="none" style={[styles.nowLine, { top: (nowMinutes / 60) * rowHeight }]}>
                <View style={[styles.nowDot, { backgroundColor: theme.danger }]} />
                <View style={[styles.nowBar, { backgroundColor: theme.danger }]} />
              </View>
            )}
          </View>
        );
      })}
    </View>
  );
}

function HabitChip({ item, onPress }: { item: ScheduledItem; onPress: (item: ScheduledItem) => void }) {
  const theme = useTheme();
  const done = isDone(item);
  const color = item.habit.color ?? theme.primary;

  return (
    <Pressable
      onPress={() => onPress(item)}
      hitSlop={4}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={item.habit.name}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: done ? color : color + '1F',
          borderColor: done ? color : color + '55',
          transform: [{ scale: pressed ? 0.9 : 1 }],
        },
      ]}>
      <ThemedText style={styles.chipEmoji}>{item.habit.icon}</ThemedText>
      {done && (
        <View style={[styles.checkBadge, { backgroundColor: theme.background, borderColor: color }]}>
          <ThemedText style={[styles.checkText, { color }]}>✓</ThemedText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', paddingHorizontal: Spacing.two, paddingBottom: Spacing.two, gap: 2 },
  dayPill: { flex: 1, alignItems: 'center', paddingVertical: Spacing.one, borderRadius: 12, gap: 1 },
  dayLetter: { fontSize: 11, lineHeight: 14 },
  scroll: { paddingHorizontal: Spacing.two, paddingBottom: Spacing.six, gap: Spacing.two },
  card: { borderRadius: 20, paddingBottom: Spacing.one, overflow: 'hidden' },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  row: { flexDirection: 'row' },
  gutter: { paddingTop: 5, alignItems: 'center' },
  hourLabel: { fontSize: 11, lineHeight: 14, fontVariant: ['tabular-nums'] },
  cell: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 3,
    marginHorizontal: 1,
  },
  chip: {
    width: 32,
    height: 32,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipEmoji: { fontSize: 15, lineHeight: 20 },
  checkBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { fontSize: 9, lineHeight: 11, fontFamily: FontFamily.black },
  nowLine: { position: 'absolute', left: 0, right: 0, flexDirection: 'row', alignItems: 'center' },
  nowDot: { width: 7, height: 7, borderRadius: 4, marginLeft: -3 },
  nowBar: { flex: 1, height: 2, borderRadius: 1 },
});
