import { useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useSession } from '@/features/auth/session-provider';
import { completedIdentity } from '@/features/celebration/completed-identity';
import { DayCompleteOverlay } from '@/features/celebration/day-complete';
import { IdentityStepToast } from '@/features/celebration/identity-step';
import type { LogStatus } from '@/features/checkins/api';
import { CoachCard } from '@/features/coach/components/coach-card';
import { useIdentities } from '@/features/identities/api';
import { WeeklyReviewCard, WeeklyReviewOffer, WeeklyReviewWriting } from '@/features/coach/components/weekly-review-card';
import { useCoachTip } from '@/features/coach/use-coach-tip';
import { useWeeklyReviewSlot } from '@/features/coach/use-weekly-review-slot';
import { NorthStarCard } from '@/features/north-star/components/north-star-card';
import { CheersNotice, useUnseenCheers } from '@/features/social/components/cheers';
import { enqueueHabitPhoto, takeHabitPhoto } from '@/features/social/photos';
import { useCircleHabitInfo } from '@/features/social/use-circle-habit-info';
import { useNorthStar } from '@/features/north-star/use-north-star';
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
import { addDays, formatLocalDate } from '@/lib/recurrence';
import { showNotice } from '@/lib/confirm';
import { storage } from '@/lib/storage';
import { track } from '@/lib/analytics';
import { hapticLight, hapticSuccess } from '@/lib/haptics';
import { getDayBand } from '@/lib/time/day-bands';

const SECTION_ORDER: ScheduleBand[] = ['morning', 'afternoon', 'night', 'anytime'];
const FOCUS_HIGHLIGHT_MS = 3000;
/** The day the user closed "yesterday" as it was (YYYY-MM-DD). */
/** Per account: several people may share a phone. */
const catchUpClosedKey = (userId: string | undefined) => `habia.catchUp.closedOn.${userId ?? 'anon'}`;

export default function TodayScreen() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const bandColors = useBandColors();
  const now = useNow();
  const { today, tomorrow } = useTodayRange(now);
  const { items, bands, hasHabits, isLoading, error, toggleItem } = useSchedule(today, tomorrow);
  // One prompt above the list at a time: catching up yesterday (it protects today's streak), then
  // Brote's weekly review, then the fortnightly north-star question, then cheers from friends, then
  // the coach tip.
  // The coach waits until yesterday is settled, so it never comments on a miss that was only unlogged.
  const yesterdayDate = useMemo(() => addDays(today, -1), [today]);
  const yesterday = useSchedule(yesterdayDate, today);
  const { session } = useSession();
  const queryClient = useQueryClient();
  const catchUpKey = catchUpClosedKey(session?.user.id);
  const [catchUpClosedOn, setCatchUpClosedOn] = useState(() => storage.getItem(catchUpKey));
  const todayKey = formatLocalDate(today);
  const catchUpPending =
    catchUpClosedOn !== todayKey && yesterday.items.some((item) => !isDone(item) && !isSkipped(item));
  const weeklyReview = useWeeklyReviewSlot(today, yesterday.isReady && !catchUpPending);
  const showWeeklyReview = yesterday.isReady && !catchUpPending && hasHabits && weeklyReview.slot !== null;
  const northStar = useNorthStar(today);
  const showNorthStar =
    yesterday.isReady && !catchUpPending && !showWeeklyReview && hasHabits && northStar.visible;
  const unseenCheers = useUnseenCheers();
  const showCheers =
    yesterday.isReady && !catchUpPending && !showWeeklyReview && !showNorthStar && unseenCheers.length > 0;
  const closeCatchUp = () => {
    storage.setItem(catchUpKey, todayKey);
    setCatchUpClosedOn(todayKey);
  };
  const coach = useCoachTip({
    today,
    now,
    bandConfig: bands,
    items,
    itemsLoading: isLoading,
    enabled: yesterday.isReady && !catchUpPending && !showWeeklyReview && !showNorthStar && !showCheers,
  });

  // Keep only the key: the item itself is read fresh from `items` on every render.
  const [chainNextKey, setChainNextKey] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  // Finishing a whole branch today: "closer to becoming…". The day's confetti wins on the same tap.
  const { data: identities } = useIdentities();
  const [identityStepId, setIdentityStepId] = useState<string | null>(null);
  const identityStep = identities?.find((identity) => identity.id === identityStepId) ?? null;
  const closeIdentityStep = useCallback(() => setIdentityStepId(null), []);
  // Stable callbacks: the overlays restart their auto-close timers whenever onDismiss changes.
  const closeCelebration = useCallback(() => setCelebrating(false), []);
  const closeChain = useCallback(() => setChainNextKey(null), []);
  const chainNext = items.find((item) => item.key === chainNextKey && !isDone(item) && !isSkipped(item));
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
  const circleInfo = useCircleHabitInfo(items.some((item) => item.habit.circle_habit_id));

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
  // A circle's habit that asks for a photo opens the camera first: no photo, no check-in. The photo
  // uploads in the background (queued on the phone when offline); the check-in is immediate.
  const onToggle = (item: ScheduledItem, status?: LogStatus) => {
    const shared = item.habit.circle_habit_id ? circleInfo[item.habit.circle_habit_id] : undefined;
    const completing = status !== 'skipped' && !isDone(item);
    if (completing && shared?.photoRequired && session && formatLocalDate(item.at) === todayKey) {
      const userId = session.user.id;
      takeHabitPhoto()
        .then((photo) => {
          if (photo.status === 'denied') return showNotice(t('photos.cameraDenied'));
          if (photo.status !== 'ok') return;
          applyToggle(item, status);
          enqueueHabitPhoto({
            circleId: shared.circleId,
            circleHabitId: item.habit.circle_habit_id!,
            userId,
            day: todayKey,
            base64: photo.base64,
          }).then(() => queryClient.invalidateQueries({ queryKey: ['social'] }));
        })
        .catch(() => showNotice(t('photos.failed')));
      return;
    }
    applyToggle(item, status);
  };

  const applyToggle = (item: ScheduledItem, status?: LogStatus) => {
    const completing = status !== 'skipped' && !isDone(item);
    toggleItem(item, status);
    const next = completing ? nextInChain(item, items) : undefined;
    setChainNextKey(next?.key ?? null);
    if (next) setIdentityStepId(null);

    // Celebrate only when *this* check-in is the one that finishes the day,
    // never when simply opening an already-complete day.
    const pendingAfter = items.filter((other) => !isDone(other) && !isSkipped(other) && other.key !== item.key).length;
    if (completing && pendingAfter === 0) {
      hapticSuccess();
      setIdentityStepId(null);
      setCelebrating(true);
      track('day_completed', {
        habits: items.filter((other) => !isSkipped(other) || other.key === item.key).length,
      });
    } else if (completing && !next) {
      // One bottom card at a time: the next habit of a chain is the more useful nudge.
      const identityId = completedIdentity(item, items);
      if (identityId) {
        hapticLight();
        setIdentityStepId(identityId);
        track('identity_day_completed');
      }
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
                {countable.length === 0
                  ? t(items.length > 0 ? 'today.heroAllRest' : hasHabits ? 'today.heroRest' : 'today.heroEmpty')
                  : done === countable.length
                    ? t('today.allDone')
                    : t('today.progress', { done, total: countable.length })}
              </ThemedText>
            </View>
            {countable.length > 0 && (
              <ProgressRing progress={progress} size={92} stroke={10} color={sky.accent} track={theme.backgroundElement}>
                <ThemedText type="heading" style={{ color: sky.accent }}>
                  {done}/{countable.length}
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

          {showWeeklyReview && weeklyReview.slot?.kind === 'review' && (
            <WeeklyReviewCard
              review={weeklyReview.slot.review}
              onDone={() => weeklyReview.slot?.kind === 'review' && weeklyReview.markSeen(weeklyReview.slot.review.id)}
            />
          )}
          {showWeeklyReview && weeklyReview.slot?.kind === 'writing' && <WeeklyReviewWriting />}
          {showWeeklyReview && weeklyReview.slot?.kind === 'offer' && (
            <WeeklyReviewOffer onAccept={weeklyReview.accept} onDecline={weeklyReview.decline} />
          )}
          {showNorthStar && (
            <NorthStarCard
              thanks={northStar.thanks}
              onAnswer={northStar.answer}
              onSnooze={northStar.snooze}
            />
          )}
          {showCheers && <CheersNotice cheers={unseenCheers} />}
          {coach.tip && hasHabits && (
            <CoachCard tip={coach.tip} items={items} onToggle={onToggle} onDismiss={coach.dismiss} />
          )}

          {catchUpPending && <YesterdayCatchUp onActionsOpened={onActionsOpened} onDismiss={closeCatchUp} />}

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
                    circleLabel={item.habit.circle_habit_id ? circleInfo[item.habit.circle_habit_id]?.label : undefined}
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

        {identityStep && !celebrating && (
          <IdentityStepToast key={identityStep.id} identity={identityStep} onDismiss={closeIdentityStep} />
        )}
        {chainNext && <ChainPrompt item={chainNext} onDone={() => onToggle(chainNext)} onDismiss={closeChain} />}

        {/* Under the celebration: the confetti's scrim covers it instead of the other way round. */}
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

        {celebrating && <DayCompleteOverlay votes={countable.length} onDismiss={closeCelebration} />}
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
