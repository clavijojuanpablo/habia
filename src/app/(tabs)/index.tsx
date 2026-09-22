import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { isDone, nextInChain, type ScheduleBand, type ScheduledItem } from '@/features/schedule/build-schedule';
import { ChainPrompt } from '@/features/schedule/components/chain-prompt';
import { HabitCheckRow } from '@/features/schedule/components/habit-check-row';
import { useSchedule } from '@/features/schedule/use-schedule';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useBandColors, useTheme } from '@/hooks/use-theme';
import { getDayBand } from '@/lib/time/day-bands';

const SECTION_ORDER: ScheduleBand[] = ['morning', 'afternoon', 'night', 'anytime'];

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const bandColors = useBandColors();
  const now = useNow();
  const { today, tomorrow } = useTodayRange(now);
  const { items, bands, hasHabits, isLoading, error, toggleItem } = useSchedule(today, tomorrow);

  // Keep only the key: the item itself is read fresh from `items` on every render.
  const [chainNextKey, setChainNextKey] = useState<string | null>(null);
  const chainNext = items.find((item) => item.key === chainNextKey && !isDone(item));
  const habitsById = new Map(items.map((item) => [item.habit.id, item.habit]));

  // Checking an anchor surfaces the next habit of its chain (habit stacking).
  const onToggle = (item: ScheduledItem, status?: 'done' | 'done_minimum') => {
    const completing = !isDone(item);
    toggleItem(item, status);
    setChainNextKey(completing ? (nextInChain(item, items)?.key ?? null) : null);
  };

  const currentBand = getDayBand(now.getHours(), bands);
  const sky = bandColors[currentBand];
  const done = items.filter(isDone).length;
  const progress = items.length > 0 ? done / items.length : 0;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Sky header: its palette follows the current day band */}
          <View style={[styles.sky, { backgroundColor: sky.background }]}>
            <ThemedText type="small" style={{ color: sky.accent }}>
              {today.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
            </ThemedText>
            <ThemedText type="subtitle">{t(`today.greeting.${currentBand}`)}</ThemedText>
            {items.length > 0 && (
              <>
                <View style={[styles.track, { backgroundColor: theme.background }]}>
                  <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: sky.accent }]} />
                </View>
                <ThemedText type="smallBold">
                  {done === items.length ? t('today.allDone') : t('today.progress', { done, total: items.length })}
                </ThemedText>
              </>
            )}
          </View>

          {isLoading && <ActivityIndicator color={theme.primary} />}
          {error && (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {t('common.error')}
            </ThemedText>
          )}
          {!isLoading && !hasHabits && (
            <ThemedText themeColor="textSecondary" style={styles.empty}>
              {t('today.empty')}
            </ThemedText>
          )}

          {SECTION_ORDER.map((band) => {
            const sectionItems = items.filter((item) => item.band === band);
            if (sectionItems.length === 0) return null;
            const colors = bandColors[band];
            return (
              <View key={band} style={[styles.section, { backgroundColor: colors.background }]}>
                <ThemedText type="smallBold" style={{ color: colors.accent }}>
                  {t(`bands.${band}`)}
                </ThemedText>
                {sectionItems.map((item) => (
                  <HabitCheckRow
                    key={item.key}
                    item={item}
                    anchor={item.anchorHabitId ? habitsById.get(item.anchorHabitId) : undefined}
                    onToggle={onToggle}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>

        {chainNext && (
          <ChainPrompt
            item={chainNext}
            onDone={() => onToggle(chainNext)}
            onDismiss={() => setChainNextKey(null)}
          />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('today.addHabit')}
          onPress={() => router.push('/habit/new')}
          style={({ pressed }) => [styles.fab, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}>
          <Icon name="add" color={theme.onPrimary} size={28} />
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: 120,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  sky: { borderRadius: Spacing.four, padding: Spacing.four, gap: Spacing.two },
  track: { height: 10, borderRadius: 5, overflow: 'hidden', marginTop: Spacing.two },
  fill: { height: '100%', borderRadius: 5 },
  empty: { textAlign: 'center', paddingHorizontal: Spacing.four, paddingVertical: Spacing.five },
  section: { borderRadius: Spacing.four, padding: Spacing.two, gap: Spacing.two, paddingTop: Spacing.three },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
});
