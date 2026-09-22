import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { isDone, type ScheduledItem } from '../build-schedule';

type Props = {
  item: ScheduledItem;
  /** The habit this one is stacked after, when it applies today. */
  anchor?: { icon: string; name: string };
  onToggle: (item: ScheduledItem, status?: 'done' | 'done_minimum') => void;
};

export function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function HabitCheckRow({ item, anchor, onToggle }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const scale = useSharedValue(1);
  const done = isDone(item);
  const minimum = item.log?.status === 'done_minimum';
  const color = item.habit.color ?? theme.primary;

  const checkStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  const toggle = (status: 'done' | 'done_minimum' = 'done') => {
    if (!done) scale.set(withSequence(withSpring(1.3, { duration: 150 }), withSpring(1)));
    onToggle(item, status);
  };

  const cue = anchor
    ? t('today.afterHabit', { habit: `${anchor.icon} ${anchor.name}` })
    : item.habit.cue_type === 'context' && item.habit.context_label
      ? `📍 ${item.habit.context_label}`
      : null;
  const subtitle = [
    cue ?? (item.hasTime ? formatTime(item.at) : null),
    minimum ? t('today.minimumDone') : item.habit.two_minute_version,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: theme.backgroundElement,
          boxShadow: Shadow.card,
          opacity: done ? 0.7 : 1,
          marginLeft: item.anchorHabitId ? Math.min(item.depth, 3) * Spacing.three : 0,
        },
      ]}>
      <Pressable
        style={styles.body}
        onPress={() => router.push({ pathname: '/habit/[id]', params: { id: item.habit.id } })}
        onLongPress={() => item.habit.two_minute_version && !done && toggle('done_minimum')}
        accessibilityHint={item.habit.two_minute_version ? t('today.longPressHint') : undefined}>
        <View style={[styles.emoji, { backgroundColor: color + '26' }]}>
          <ThemedText style={styles.emojiText}>{item.habit.icon}</ThemedText>
        </View>
        <View style={styles.texts}>
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
        hitSlop={8}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={item.habit.name}>
        <Animated.View
          style={[
            styles.check,
            { borderColor: done ? color : color + '66', backgroundColor: done ? color : color + '12' },
            checkStyle,
          ]}>
          {done && <Icon name="check" size={20} color="#fff" />}
        </Animated.View>
      </Pressable>
    </View>
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
  texts: { flex: 1 },
  check: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
