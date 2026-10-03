import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import type { LogStatus } from '@/features/checkins/api';
import { useTheme } from '@/hooks/use-theme';
import { formatLocalDate } from '@/lib/recurrence';

import { isDone, isSkipped, type ScheduledItem } from '../build-schedule';

type Props = {
  item: ScheduledItem | null;
  onToggle: (item: ScheduledItem, status?: LogStatus) => void;
  onClose: () => void;
};

type Action = { key: string; emoji: string; label: string; hint?: string; run: () => void };

/**
 * Every action a habit offers today, in one visible place: done, the 2-minute
 * version (the 2-minute rule) and a rest day on purpose (forgiving, not punishing).
 * Replaces hidden long-presses that nobody discovers.
 */
export function HabitActionsSheet({ item, onToggle, onClose }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  if (!item) return null;

  const done = isDone(item);
  const skipped = isSkipped(item);
  const actions: Action[] = [];
  if (done) {
    actions.push({ key: 'undo', emoji: '↩️', label: t('today.actions.undo'), run: () => onToggle(item) });
  } else if (skipped) {
    actions.push({
      key: 'unrest',
      emoji: '↩️',
      label: t('today.actions.unrest'),
      run: () => onToggle(item, 'skipped'),
    });
  } else {
    // Focus mode: only for today (a timer for another day would plant on the wrong day).
    if (formatLocalDate(item.at) === formatLocalDate(new Date())) {
      actions.push({
        key: 'focus',
        emoji: '⏱️',
        label: t('today.actions.focus'),
        run: () => router.push({ pathname: '/focus', params: { habitId: item.habit.id, at: item.at.toISOString() } }),
      });
    }
    actions.push({ key: 'done', emoji: '✅', label: t('today.actions.done'), run: () => onToggle(item) });
    if (item.habit.two_minute_version) {
      actions.push({
        key: 'minimum',
        emoji: '🌱',
        label: t('today.actions.minimum'),
        hint: item.habit.two_minute_version,
        run: () => onToggle(item, 'done_minimum'),
      });
    }
    actions.push({
      key: 'rest',
      emoji: '😴',
      label: t('today.actions.rest'),
      hint: t('today.actions.restHint'),
      run: () => onToggle(item, 'skipped'),
    });
  }
  actions.push({
    key: 'edit',
    emoji: '✏️',
    label: t('today.actions.edit'),
    run: () => router.push({ pathname: '/habit/[id]', params: { id: item.habit.id } }),
  });

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: theme.scrim }]} onPress={onClose} accessibilityLabel={t('common.close')} />
      <View style={[styles.sheet, { backgroundColor: theme.background }]}>
        <ThemedText type="heading" style={styles.center} numberOfLines={1}>
          {item.habit.icon} {item.habit.name}
        </ThemedText>
        {actions.map((action) => (
          <Pressable
            key={action.key}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              action.run();
            }}
            style={({ pressed }) => [
              styles.action,
              { backgroundColor: theme.backgroundElement, boxShadow: Shadow.card, opacity: pressed ? 0.8 : 1 },
            ]}>
            <ThemedText style={styles.emoji}>{action.emoji}</ThemedText>
            <View style={styles.texts}>
              <ThemedText type="smallBold">{action.label}</ThemedText>
              {action.hint && (
                <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
                  {action.hint}
                </ThemedText>
              )}
            </View>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    gap: Spacing.two,
    boxShadow: Shadow.raised,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.lg,
  },
  emoji: { fontSize: 24, lineHeight: 30 },
  texts: { flex: 1 },
});
