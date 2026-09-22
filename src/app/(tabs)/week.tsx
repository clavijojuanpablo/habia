import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { WeekGrid } from '@/features/schedule/components/week-grid';
import { useSchedule } from '@/features/schedule/use-schedule';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { addDays, startOfWeek } from '@/lib/recurrence';

export default function WeekScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const [offset, setOffset] = useState(0);

  const currentWeekKey = startOfWeek(now).getTime();
  const { weekStart, weekEnd } = useMemo(() => {
    const start = addDays(new Date(currentWeekKey), offset * 7);
    return { weekStart: start, weekEnd: addDays(start, 7) };
  }, [currentWeekKey, offset]);

  const { items, bands, toggleItem } = useSchedule(weekStart, weekEnd);

  const format = (d: Date) => d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
  const title = offset === 0 ? t('week.thisWeek') : `${format(weekStart)} – ${format(addDays(weekEnd, -1))}`;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <Pressable onPress={() => setOffset(offset - 1)} hitSlop={12} accessibilityLabel="previous week">
            <Icon name="back" color={theme.text} />
          </Pressable>
          <Pressable onPress={() => setOffset(0)} style={styles.title}>
            <ThemedText type="smallBold">{title}</ThemedText>
          </Pressable>
          <Pressable onPress={() => setOffset(offset + 1)} hitSlop={12} accessibilityLabel="next week">
            <Icon name="forward" color={theme.text} />
          </Pressable>
        </View>
        <WeekGrid weekStart={weekStart} items={items} bands={bands} now={now} onToggle={toggleItem} />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  title: { flex: 1, alignItems: 'center' },
});
