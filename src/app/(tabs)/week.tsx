import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { isBeforeStart } from '@/features/checkins/rules';
import { useProfile } from '@/features/profile/api';
import { isDone } from '@/features/schedule/build-schedule';
import { WeekGrid } from '@/features/schedule/components/week-grid';
import { useSchedule } from '@/features/schedule/use-schedule';
import { TopBar } from '@/features/streak/components/top-bar';
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
  const { data: profile } = useProfile();
  // Nothing existed before the user joined: do not let them browse into the void.
  const joinedOn = profile ? new Date(profile.created_at) : null;
  const canGoBack = !joinedOn || !isBeforeStart(addDays(weekStart, -1), joinedOn);
  const done = items.filter(isDone).length;
  const progress = items.length === 0 ? 0 : done / items.length;

  const format = (d: Date) => d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
  const range = `${format(weekStart)} – ${format(addDays(weekEnd, -1))}`;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.inner}>
          <TopBar />
          <View style={styles.header}>
            <RoundButton
              icon="back"
              label={t('week.previous')}
              disabled={!canGoBack}
              onPress={() => setOffset(offset - 1)}
            />
            <Pressable onPress={() => setOffset(0)} style={styles.titleBlock}>
              <ThemedText type="smallBold">{offset === 0 ? t('week.thisWeek') : range}</ThemedText>
              {offset === 0 && (
                <ThemedText type="small" themeColor="textSecondary">
                  {range}
                </ThemedText>
              )}
            </Pressable>
            <RoundButton icon="forward" label={t('week.next')} onPress={() => setOffset(offset + 1)} />
          </View>

          {items.length > 0 && (
            <View style={styles.progress}>
              <View style={[styles.track, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: theme.primary }]} />
              </View>
              <ThemedText type="small" themeColor="textSecondary">
                {t('week.progress', { done, total: items.length })}
              </ThemedText>
            </View>
          )}

          <WeekGrid weekStart={weekStart} items={items} bands={bands} now={now} onToggle={toggleItem} />
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function RoundButton({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'back' | 'forward';
  label: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.round,
        { backgroundColor: theme.backgroundElement, opacity: disabled ? 0.35 : pressed ? 0.7 : 1 },
      ]}>
      <Icon name={icon} color={disabled ? theme.textSecondary : theme.text} size={18} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  inner: { flex: 1, width: '100%', maxWidth: MaxContentWidth, alignSelf: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
  },
  titleBlock: { flex: 1, alignItems: 'center' },
  round: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
  },
  track: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
});
