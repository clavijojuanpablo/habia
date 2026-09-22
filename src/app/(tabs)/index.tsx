import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { ProgressRing } from '@/components/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BandEmoji, MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { isDone, nextInChain, type ScheduleBand, type ScheduledItem } from '@/features/schedule/build-schedule';
import { ChainPrompt } from '@/features/schedule/components/chain-prompt';
import { HabitCheckRow } from '@/features/schedule/components/habit-check-row';
import { useSchedule } from '@/features/schedule/use-schedule';
import { TopBar } from '@/features/streak/components/top-bar';
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
        <TopBar />
        <ScrollView contentContainerStyle={styles.content}>
          {/* Hero: greeting + today's ring, painted with the current band's pastel */}
          <View style={[styles.hero, { backgroundColor: sky.background }]}>
            <View style={styles.heroText}>
              <ThemedText type="caption" style={{ color: sky.accent }}>
                {BandEmoji[currentBand]}{' '}
                {today.toLocaleDateString(i18n.language, { weekday: 'long', day: 'numeric', month: 'long' })}
              </ThemedText>
              <ThemedText type="subtitle">{t(`today.greeting.${currentBand}`)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {items.length === 0
                  ? t('today.heroEmpty')
                  : done === items.length
                    ? t('today.allDone')
                    : t('today.progress', { done, total: items.length })}
              </ThemedText>
            </View>
            {items.length > 0 && (
              <ProgressRing progress={progress} size={92} stroke={10} color={sky.accent} track={theme.backgroundElement}>
                <ThemedText type="heading" style={{ color: sky.accent }}>
                  {done}/{items.length}
                </ThemedText>
              </ProgressRing>
            )}
          </View>

          {isLoading && <ActivityIndicator color={theme.primary} />}
          {error && (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {t('common.error')}
            </ThemedText>
          )}

          {!isLoading && !hasHabits && (
            <View style={[styles.empty, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.emptyEmoji}>🌱</ThemedText>
              <ThemedText type="heading" style={styles.center}>
                {t('today.emptyTitle')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {t('today.empty')}
              </ThemedText>
              <Button label={t('today.createFirst')} onPress={() => router.push('/habit/new')} />
            </View>
          )}

          {SECTION_ORDER.map((band) => {
            const sectionItems = items.filter((item) => item.band === band);
            if (sectionItems.length === 0) return null;
            const colors = bandColors[band];
            const sectionDone = sectionItems.filter(isDone).length;
            return (
              <View key={band} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="heading">
                    {BandEmoji[band]} {t(`bands.${band}`)}
                  </ThemedText>
                  <View style={[styles.countPill, { backgroundColor: colors.background }]}>
                    <ThemedText type="caption" style={{ color: colors.accent }}>
                      {sectionDone}/{sectionItems.length}
                    </ThemedText>
                  </View>
                </View>
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
          <ChainPrompt item={chainNext} onDone={() => onToggle(chainNext)} onDismiss={() => setChainNextKey(null)} />
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('today.addHabit')}
          onPress={() => router.push('/habit/new')}
          style={({ pressed }) => [
            styles.fab,
            { backgroundColor: theme.primary, boxShadow: Shadow.raised, transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}>
          <Icon name="add" color={theme.onPrimary} size={30} />
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  content: {
    padding: Spacing.three,
    paddingTop: Spacing.one,
    gap: Spacing.four,
    paddingBottom: 110,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  hero: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  heroText: { flex: 1, gap: Spacing.one },
  empty: {
    borderRadius: Radius.xl,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
    boxShadow: Shadow.card,
  },
  emptyEmoji: { fontSize: 56, lineHeight: 68 },
  section: { gap: Spacing.two },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.one },
  countPill: { paddingHorizontal: Spacing.two, paddingVertical: 2, borderRadius: Radius.pill },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.three,
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
