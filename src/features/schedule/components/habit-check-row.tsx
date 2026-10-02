import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import type { LogStatus } from '@/features/checkins/api';
import { useTheme } from '@/hooks/use-theme';

import { isDone, isSkipped, type ScheduledItem } from '../build-schedule';

type Props = {
  item: ScheduledItem;
  /** The habit this one is stacked after, when it applies today. */
  anchor?: { icon: string; name: string };
  onToggle: (item: ScheduledItem, status?: LogStatus) => void;
  /** Tapping the row opens its actions (2-minute version, rest day, edit). */
  onOpenActions: (item: ScheduledItem) => void;
  /** Draws attention to the row, e.g. after tapping its reminder. */
  highlighted?: boolean;
  onLayout?: (event: LayoutChangeEvent) => void;
  /** "🤝 Familia" for a shared circle habit: the group is part of the cue. */
  circleLabel?: string;
};

export function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function HabitCheckRow({
  item,
  anchor,
  onToggle,
  onOpenActions,
  highlighted = false,
  onLayout,
  circleLabel,
}: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);
  const done = isDone(item);
  const skipped = isSkipped(item);
  const minimum = item.log?.status === 'done_minimum';
  const color = item.habit.color ?? theme.primary;

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const rowStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));

  // Two gentle beats, then still: enough to find the row without nagging.
  useEffect(() => {
    if (highlighted) pulse.set(withRepeat(withSequence(withTiming(1.03, { duration: 220 }), withTiming(1, { duration: 220 })), 2));
  }, [highlighted, pulse]);

  const toggle = (status: LogStatus = 'done') => {
    if (!done && status !== 'skipped') scale.set(withSequence(withSpring(1.3, { duration: 150 }), withSpring(1)));
    onToggle(item, status);
  };

  const openActions = () => onOpenActions(item);

  const cue = anchor
    ? t('today.afterHabit', { habit: `${anchor.icon} ${anchor.name}` })
    : item.habit.cue_type === 'context' && item.habit.context_label
      ? `📍 ${item.habit.context_label}`
      : null;
  const subtitle = [
    cue ?? (item.hasTime ? formatTime(item.at) : null),
    skipped ? t('today.restDay') : minimum ? t('today.minimumDone') : item.habit.two_minute_version,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Animated.View
      onLayout={onLayout}
      style={[
        styles.row,
        {
          backgroundColor: theme.backgroundElement,
          boxShadow: Shadow.card,
          opacity: done || skipped ? 0.7 : 1,
          marginLeft: item.anchorHabitId ? Math.min(item.depth, 3) * Spacing.three : 0,
          // Shared with a circle: a lavender edge, so it reads as "ours" at a glance.
          borderLeftWidth: circleLabel ? 5 : 0,
          borderLeftColor: theme.lavender,
          // An outline, not a border, so the highlight never shifts the layout.
          outlineWidth: highlighted ? 2.5 : 0,
          outlineColor: color,
        },
        rowStyle,
      ]}>
      <Pressable
        style={styles.body}
        onPress={openActions}
        onLongPress={openActions}
        accessibilityRole="button"
        accessibilityHint={t('today.actions.hint')}>
        <View style={[styles.emoji, { backgroundColor: color + '26' }]}>
          <ThemedText style={styles.emojiText}>{item.habit.icon}</ThemedText>
        </View>
        <View style={styles.texts}>
          {circleLabel && (
            <View style={[styles.circleTag, { backgroundColor: theme.lavenderSoft }]}>
              <ThemedText type="caption" numberOfLines={1} style={{ color: theme.lavender }}>
                {circleLabel}
              </ThemedText>
            </View>
          )}
          <ThemedText
            type="heading"
            numberOfLines={1}
            style={done && { textDecorationLine: 'line-through' }}>
            {item.habit.name}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>
      </Pressable>

      <Pressable
        onPress={() => toggle()}
        onLongPress={openActions}
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={item.habit.name}>
        <Animated.View
          style={[
            styles.check,
            skipped
              ? { borderColor: theme.textSecondary, backgroundColor: theme.textSecondary + '1F' }
              : { borderColor: done ? color : color + '66', backgroundColor: done ? color : color + '12' },
            checkStyle,
          ]}>
          {done && <Icon name="check" size={20} color={theme.onPrimary} />}
          {skipped && <Icon name="rest" size={18} color={theme.textSecondary} />}
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: 14,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.lg,
  },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  emoji: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 26, lineHeight: 32 },
  texts: { flex: 1, gap: 2 },
  circleTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    maxWidth: '100%',
  },
  check: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
