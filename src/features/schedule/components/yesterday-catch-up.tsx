import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { addDays } from '@/lib/recurrence';

import { isDone, isSkipped } from '../build-schedule';
import { useSchedule } from '../use-schedule';
import { HabitActionsSheet } from './habit-actions-sheet';
import { HabitCheckRow } from './habit-check-row';

const MAX_ROWS = 4;

/**
 * "Did you do it yesterday?" - forgetting to log is not the same as missing a
 * habit, and with the never-miss-twice rule an unlogged day is costly. Only
 * yesterday is offered: older days stay in the Week view. "Así está bien" closes it
 * for today without touching the logs: a real miss stays a miss (and the coach can speak).
 */
export function YesterdayCatchUp({
  onActionsOpened,
  onDismiss,
}: {
  onActionsOpened: () => void;
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const { today } = useTodayRange(now);
  const yesterday = useMemo(() => addDays(today, -1), [today]);
  const { items, toggleItem } = useSchedule(yesterday, today);
  const [open, setOpen] = useState(false);
  const [actionsKey, setActionsKey] = useState<string | null>(null);

  // A rest day on purpose is settled, not pending.
  const pending = items.filter((item) => !isDone(item) && !isSkipped(item));
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
          .map((item) => (
            <HabitCheckRow
              key={item.key}
              item={item}
              onToggle={toggleItem}
              onOpenActions={(picked) => {
                setActionsKey(picked.key);
                onActionsOpened();
              }}
            />
          ))}

      <Pressable onPress={onDismiss} hitSlop={8} accessibilityRole="button" style={styles.dismiss}>
        <ThemedText type="caption" style={{ color: theme.primary }}>
          {t('yesterday.asIs')}
        </ThemedText>
      </Pressable>

      <HabitActionsSheet
        item={items.find((item) => item.key === actionsKey) ?? null}
        onToggle={toggleItem}
        onClose={() => setActionsKey(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing.two, gap: Spacing.two, boxShadow: Shadow.card },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.two },
  emoji: { fontSize: 24, lineHeight: 30 },
  flex: { flex: 1 },
  dismiss: { alignSelf: 'flex-end', paddingHorizontal: Spacing.two },
});
