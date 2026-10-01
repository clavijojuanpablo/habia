import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Icon } from '@/components/icon';
import { OfflineBanner } from '@/components/offline-banner';
import { ProgressRing } from '@/components/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BandEmoji, MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { DayCompleteOverlay } from '@/features/celebration/day-complete';
import type { LogStatus } from '@/features/checkins/api';
import { CoachCard } from '@/features/coach/components/coach-card';
import { useCoachTip } from '@/features/coach/use-coach-tip';
import { Brote } from '@/features/mascot/brote';
import { isDone, isSkipped, nextInChain, type ScheduleBand, type ScheduledItem } from '@/features/schedule/build-schedule';
import { ActionsTip, hasSeenActionsTip, markActionsTipSeen } from '@/features/schedule/components/actions-tip';
import { ChainPrompt } from '@/features/schedule/components/chain-prompt';
import { HabitActionsSheet } from '@/features/schedule/components/habit-actions-sheet';
import { HabitCheckRow } from '@/features/schedule/components/habit-check-row';
import { YesterdayCatchUp } from '@/features/schedule/components/yesterday-catch-up';
import { useSchedule } from '@/features/schedule/use-schedule';
import { TopBar } from '@/features/streak/components/top-bar';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useBandColors, useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';
import { hapticSuccess } from '@/lib/haptics';
import { getDayBand } from '@/lib/time/day-bands';

const SECTION_ORDER: ScheduleBand[] = ['morning', 'afternoon', 'night', 'anytime'];
const FOCUS_HIGHLIGHT_MS = 3000;

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const bandColors = useBandColors();
  const now = useNow();
  const { today, tomorrow } = useTodayRange(now);
  const { items, bands, hasHabits, isLoading, error, toggleItem } = useSchedule(today, tomorrow);
  const coach = useCoachTip({ today, now, bandConfig: bands, items, itemsLoading: isLoading });

  // Keep only the key: the item itself is read fresh from `items` on every render.
  const [chainNextKey, setChainNextKey] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const chainNext = items.find((item) => item.key === chainNextKey && !isDone(item));
  const [actionsKey, setActionsKey] = useState<string | null>(null);
  const [tipSeen, setTipSeen] = useState(hasSeenActionsTip);
  const actionsItem = items.find((item) => item.key === actionsKey) ?? null;

  const hideTip = () => {
    markActionsTipSeen();
    setTipSeen(true);
  };
  // Finding the menu on your own is exactly what the tip teaches: no need to show it again.
  const onActionsOpened = () => {
    track('habit_actions_opened');
    hideTip();
  };
  const openActions = (item: ScheduledItem) => {
    setActionsKey(item.key);
    onActionsOpened();
  };
  const habitsById = new Map(items.map((item) => [item.habit.id, item.habit]));

  // `focus` arrives from a tapped reminder: scroll to that habit and highlight it briefly.
  // Row offsets are relative to their section, so both are recorded as they lay out. The
  // screen may already be laid out when the tap arrives (app in background), hence the effect.
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Partial<Record<ScheduleBand, number>>>({});
  const rowY = useRef(new Map<string, { band: ScheduleBand; y: number }>());
  const scrolledTo = useRef<string | null>(null);

  const scrollToFocus = () => {
    if (!focus || scrolledTo.current === focus) return;
    // An hourly habit has several rows today: aim for the topmost one.
    const tops = items
      .filter((item) => item.habit.id === focus)
      .flatMap((item) => {
        const row = rowY.current.get(item.key);
        const section = row && sectionY.current[row.band];
        return row && section !== undefined ? [section + row.y] : [];
      });
    if (tops.length === 0) return;
    scrolledTo.current = focus;
    scrollRef.current?.scrollTo({ y: Math.max(0, Math.min(...tops) - Spacing.four), animated: true });
  };

  useEffect(() => {
    if (!focus || isLoading) return;
    scrollToFocus();
    const timer = setTimeout(() => {
      router.setParams({ focus: undefined });
      scrolledTo.current = null;
    }, FOCUS_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
    // Runs per incoming focus; later layouts call scrollToFocus themselves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, isLoading]);

  // Checking an anchor surfaces the next habit of its chain (habit stacking).
  // Skipping is not a completion: it neither reveals the next chained habit nor celebrates the day.
  const onToggle = (item: ScheduledItem, status?: LogStatus) => {
    const completing = status !== 'skipped' && !isDone(item);
    toggleItem(item, status);
    setChainNextKey(completing ? (nextInChain(item, items)?.key ?? null) : null);

    // Celebrate only when *this* check-in is the one that finishes the day,
    // never when simply opening an already-complete day.
    const pendingAfter = items.filter((other) => !isDone(other) && !isSkipped(other) && other.key !== item.key).length;
    if (completing && pendingAfter === 0) {
      hapticSuccess();
      setCelebrating(true);
      track('day_completed', { habits: items.length });
    }
  };

  const currentBand = getDayBand(now.getHours(), bands);
  const sky = bandColors[currentBand];
  // Rest days on purpose do not count against today's ring, same as in the stats.
  const countable = items.filter((item) => !isSkipped(item));
  const done = countable.filter(isDone).length;
  const progress = countable.length > 0 ? done / countable.length : 0;

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <TopBar />
        <OfflineBanner />
        <ScrollView ref={scrollRef} contentContainerStyle={styles.content}>
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
              <Brote mood="cheer" size={120} />
              <ThemedText type="heading" style={styles.center}>
                {t('today.emptyTitle')}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                {t('today.empty')}
              </ThemedText>
              <Button label={t('today.createFirst')} onPress={() => router.push('/habit/new')} />
            </View>
          )}

          {coach.tip && hasHabits && (
            <CoachCard tip={coach.tip} items={items} onToggle={onToggle} onDismiss={coach.dismiss} />
          )}

          <YesterdayCatchUp onActionsOpened={onActionsOpened} />

          {!tipSeen && items.length > 0 && <ActionsTip onDismiss={hideTip} />}

          {SECTION_ORDER.map((band) => {
            const sectionItems = items.filter((item) => item.band === band);
            if (sectionItems.length === 0) return null;
            const colors = bandColors[band];
            const sectionCountable = sectionItems.filter((item) => !isSkipped(item));
            const sectionDone = sectionCountable.filter(isDone).length;
            return (
              <View
                key={band}
                style={styles.section}
                onLayout={(event) => {
                  sectionY.current[band] = event.nativeEvent.layout.y;
                  scrollToFocus();
                }}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="heading">
                    {BandEmoji[band]} {t(`bands.${band}`)}
                  </ThemedText>
                  <View style={[styles.countPill, { backgroundColor: colors.background }]}>
                    <ThemedText type="caption" style={{ color: colors.accent }}>
                      {sectionDone}/{sectionCountable.length}
                    </ThemedText>
                  </View>
                </View>
                {sectionItems.map((item) => (
                  <HabitCheckRow
                    key={item.key}
                    item={item}
                    anchor={item.anchorHabitId ? habitsById.get(item.anchorHabitId) : undefined}
                    onToggle={onToggle}
                    onOpenActions={openActions}
                    highlighted={item.habit.id === focus}
                    onLayout={(event) => {
                      rowY.current.set(item.key, { band, y: event.nativeEvent.layout.y });
                      scrollToFocus();
                    }}
                  />
                ))}
              </View>
            );
          })}
        </ScrollView>

        <HabitActionsSheet item={actionsItem} onToggle={onToggle} onClose={() => setActionsKey(null)} />

        {celebrating && <DayCompleteOverlay votes={items.length} onDismiss={() => setCelebrating(false)} />}

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
