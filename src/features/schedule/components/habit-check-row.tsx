import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { isDone, type ScheduledItem } from '../build-schedule';

type Props = {
  item: ScheduledItem;
  onToggle: (item: ScheduledItem, status?: 'done' | 'done_minimum') => void;
};

export function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function HabitCheckRow({ item, onToggle }: Props) {
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

  const subtitle = [
    item.hasTime ? formatTime(item.at) : null,
    minimum ? t('today.minimumDone') : item.habit.two_minute_version,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.row, { backgroundColor: theme.background, opacity: done ? 0.75 : 1 }]}>
      <Pressable
        style={styles.body}
        onPress={() => router.push({ pathname: '/habit/[id]', params: { id: item.habit.id } })}
        onLongPress={() => item.habit.two_minute_version && !done && toggle('done_minimum')}
        accessibilityHint={item.habit.two_minute_version ? t('today.longPressHint') : undefined}>
        <View style={[styles.emoji, { backgroundColor: color + '22' }]}>
          <ThemedText style={styles.emojiText}>{item.habit.icon}</ThemedText>
        </View>
        <View style={styles.texts}>
          <ThemedText
            type="default"
            numberOfLines={1}
            style={done && { textDecorationLine: 'line-through' }}>
            {item.habit.name}
          </ThemedText>
          {subtitle ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
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
            { borderColor: color, backgroundColor: done ? color : 'transparent' },
            checkStyle,
          ]}>
          {done && <Icon name="check" size={18} color="#fff" />}
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
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  emoji: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: { fontSize: 22, lineHeight: 28 },
  texts: { flex: 1 },
  check: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
