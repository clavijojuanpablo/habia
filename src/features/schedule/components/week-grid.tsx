import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useBandColors, useTheme } from '@/hooks/use-theme';
import { addDays, daysBetween, WEEKDAYS } from '@/lib/recurrence';
import { getDayBand, type DayBandConfig } from '@/lib/time/day-bands';

import { isDone, type ScheduledItem } from '../build-schedule';

const HOUR_HEIGHT = 52;
const GUTTER = 44;
const HOURS = Array.from({ length: 24 }, (_, h) => h);

type Props = {
  weekStart: Date;
  items: ScheduledItem[];
  bands: DayBandConfig;
  now: Date;
  onToggle: (item: ScheduledItem) => void;
};

export function WeekGrid({ weekStart, items, bands, now, onToggle }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const bandColors = useBandColors();
  const days = WEEKDAYS.map((_, i) => addDays(weekStart, i));
  const todayIndex = daysBetween(weekStart, now);

  const byDay = days.map((_, i) => items.filter((item) => daysBetween(weekStart, item.at) === i));
  const allDay = byDay.map((list) => list.filter((item) => !item.displayHasTime));
  const hasAllDay = allDay.some((list) => list.length > 0);
  const bandStarts = new Set([bands.morningStartsAt, bands.afternoonStartsAt, bands.nightStartsAt]);
  const [gridWidth, setGridWidth] = useState(0);
  const columnWidth = (gridWidth - GUTTER) / 7;
  const nowOffset = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;

  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={[styles.headerRow, { borderColor: theme.border }]}>
        <View style={{ width: GUTTER }} />
        {days.map((day, i) => {
          const isToday = i === todayIndex;
          return (
            <View key={i} style={styles.dayHeader}>
              <ThemedText type="small" themeColor="textSecondary">
                {t(`weekdays.${WEEKDAYS[i]}`)}
              </ThemedText>
              <View style={[styles.dayNumber, isToday && { backgroundColor: theme.primary }]}>
                <ThemedText type="smallBold" style={isToday && { color: theme.onPrimary }}>
                  {day.getDate()}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>

      {hasAllDay && (
        <View style={[styles.allDayRow, { backgroundColor: bandColors.anytime.background, borderColor: theme.border }]}>
          <View style={[styles.gutter, { width: GUTTER }]}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.gutterText}>
              {t('week.allDay')}
            </ThemedText>
          </View>
          {allDay.map((list, i) => (
            <View key={i} style={styles.cell}>
              {list.map((item) => (
                <HabitDot key={item.key} item={item} onPress={onToggle} />
              ))}
            </View>
          ))}
        </View>
      )}

      <ScrollView contentOffset={{ x: 0, y: Math.max(0, (bands.morningStartsAt - 0.5) * HOUR_HEIGHT) }}>
        <View onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
          {HOURS.map((hour) => {
            const band = getDayBand(hour, bands);
            return (
              <View
                key={hour}
                style={[
                  styles.hourRow,
                  { backgroundColor: bandColors[band].background, borderColor: theme.border },
                ]}>
                <View style={[styles.gutter, { width: GUTTER }]}>
                  <ThemedText type="small" themeColor="textSecondary" style={styles.gutterText}>
                    {String(hour).padStart(2, '0')}
                  </ThemedText>
                  {bandStarts.has(hour) && (
                    <ThemedText style={[styles.bandLabel, { color: bandColors[band].accent }]}>
                      {t(`bands.${band}`)}
                    </ThemedText>
                  )}
                </View>
                {byDay.map((list, i) => (
                  <View key={i} style={[styles.cell, i === todayIndex && styles.todayCell]}>
                    {list
                      .filter((item) => item.displayHasTime && item.displayAt.getHours() === hour)
                      .map((item) => (
                        <HabitDot key={item.key} item={item} onPress={onToggle} />
                      ))}
                  </View>
                ))}
              </View>
            );
          })}

          {todayIndex >= 0 && todayIndex < 7 && gridWidth > 0 && (
            <View
              pointerEvents="none"
              style={[
                styles.nowLine,
                {
                  top: nowOffset,
                  left: GUTTER + todayIndex * columnWidth,
                  width: columnWidth,
                  backgroundColor: theme.danger,
                },
              ]}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function HabitDot({ item, onPress }: { item: ScheduledItem; onPress: (item: ScheduledItem) => void }) {
  const theme = useTheme();
  const done = isDone(item);
  const color = item.habit.color ?? theme.primary;

  return (
    <Pressable
      onPress={() => onPress(item)}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: done }}
      accessibilityLabel={item.habit.name}
      style={[
        styles.dot,
        { borderColor: color, backgroundColor: done ? color : theme.background },
      ]}>
      <ThemedText style={[styles.dotText, !done && { opacity: 0.6 }]}>{item.habit.icon}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dayHeader: { flex: 1, alignItems: 'center', gap: Spacing.half },
  dayNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  allDayRow: {
    flexDirection: 'row',
    minHeight: HOUR_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hourRow: {
    flexDirection: 'row',
    height: HOUR_HEIGHT,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  gutter: { paddingTop: Spacing.half, paddingHorizontal: Spacing.half },
  gutterText: { fontSize: 11, lineHeight: 14 },
  bandLabel: { fontSize: 9, lineHeight: 12, fontWeight: 700 },
  cell: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    justifyContent: 'center',
    gap: 2,
    padding: 2,
  },
  todayCell: { backgroundColor: 'rgba(255,255,255,0.35)' },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotText: { fontSize: 13, lineHeight: 16 },
  nowLine: { position: 'absolute', height: 2, borderRadius: 1 },
});
