import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { addDays } from '@/lib/recurrence';

import { isDone } from '../build-schedule';
import { useSchedule } from '../use-schedule';
import { HabitCheckRow } from './habit-check-row';

const MAX_ROWS = 4;

/**
 * "Did you do it yesterday?" - forgetting to log is not the same as missing a
 * habit, and with the never-miss-twice rule an unlogged day is costly. Only
 * yesterday is offered: older days stay in the Week view.
 */
export function YesterdayCatchUp() {
  const { t } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const { today } = useTodayRange(now);
  const yesterday = addDays(today, -1);
  const { items, toggleItem } = useSchedule(yesterday, today);
  const [open, setOpen] = useState(false);

  const pending = items.filter((item) => !isDone(item));
  if (items.length === 0 || pending.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.header}>
        <ThemedText style={styles.emoji}>🕐</ThemedText>
        <View style={styles.flex}>
          <ThemedText type="smallBold">{t('yesterday.title', { count: pending.length })}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('yesterday.hint')}
          </ThemedText>
        </View>
        <ThemedText type="heading" themeColor="textSecondary">
          {open ? '▾' : '▸'}
        </ThemedText>
      </Pressable>

      {open &&
        pending
          .slice(0, MAX_ROWS)
          .map((item) => <HabitCheckRow key={item.key} item={item} onToggle={toggleItem} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing.two, gap: Spacing.two, boxShadow: Shadow.card },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.two },
  emoji: { fontSize: 24, lineHeight: 30 },
  flex: { flex: 1 },
});
