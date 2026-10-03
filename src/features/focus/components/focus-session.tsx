import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ProgressRing } from '@/components/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import type { LogStatus } from '@/features/checkins/api';
import { Brote } from '@/features/mascot/brote';
import { isDone, type ScheduledItem } from '@/features/schedule/build-schedule';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';
import { storage } from '@/lib/storage';

import { cancelFocusEnd, scheduleFocusEnd } from '../focus-notification';
import {
  elapsedMs,
  formatClock,
  leftMs,
  MINIMUM_FOCUS_MS,
  pauseTimer,
  resumeTimer,
  startTimer,
  type FocusTimer,
} from '../focus-timer';

const DURATIONS = [5, 10, 15, 25, 45];
const lastKey = (habitId: string) => `habia.focus.${habitId}`;

/**
 * Focus on one habit: pick minutes, start, and the habit checks itself when time is up (the
 * 2-minute option counts as its minimum version). Stopping early after two minutes can still
 * plant the minimum: effort is never wasted.
 */
export function FocusSession({
  item,
  onCheckIn,
}: {
  item: ScheduledItem;
  onCheckIn: (item: ScheduledItem, status: LogStatus) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const habit = item.habit;
  const color = habit.color ?? theme.primary;
  const hasMinimum = !!habit.two_minute_version;
  const [timer, setTimer] = useState<FocusTimer>(() => ({
    phase: 'setup',
    minutes: Number(storage.getItem(lastKey(habit.id))) || 25,
  }));
  const [stopping, setStopping] = useState(false);
  // Ticks every second only while counting.
  const now = useNow(timer.phase === 'running' ? 1000 : 60_000).getTime();
  const left = leftMs(timer, now);
  const minimumRun = timer.minutes === 2;

  // The session tries to plant once by itself; "planted" is read from the habit, not assumed: a
  // check-in that did not happen (camera cancelled on a photo circle) leaves a button to retry.
  const tried = useRef(false);
  const plantStatus: LogStatus = minimumRun ? 'done_minimum' : 'done';
  const plant = (status: LogStatus) => {
    cancelFocusEnd();
    if (!isDone(item)) onCheckIn(item, status);
    if (!tried.current) track('focus_completed', { minutes: timer.minutes, status });
    tried.current = true;
  };
  const finishEarly = () => {
    plant('done_minimum');
    setTimer({ phase: 'finished', minutes: timer.minutes });
    setStopping(false);
  };
  // Time up (also when coming back from the background) reads as finished; the effect only plants.
  const timeUp = timer.phase === 'running' && left === 0;
  const phase = timeUp ? 'finished' : timer.phase;
  useEffect(() => {
    if (timeUp && !tried.current) plant(plantStatus);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp]);
  const planted = isDone(item);

  // Leaving the screen ends the session: no notice for a timer nobody watches.
  useEffect(() => () => void cancelFocusEnd(), []);

  const start = (minutes: number) => {
    storage.setItem(lastKey(habit.id), String(minutes));
    const running = startTimer(minutes, Date.now());
    setTimer(running);
    if (running.phase === 'running') {
      scheduleFocusEnd(running.endsAt, t('focus.doneTitle'), `${habit.icon} ${habit.name}`, habit.id);
    }
    track('focus_started', { minutes });
  };
  const pause = () => {
    cancelFocusEnd();
    setTimer(pauseTimer(timer, Date.now()));
  };
  const resume = () => {
    const running = resumeTimer(timer, Date.now());
    setTimer(running);
    if (running.phase === 'running') {
      scheduleFocusEnd(running.endsAt, t('focus.doneTitle'), `${habit.icon} ${habit.name}`, habit.id);
    }
  };
  const leave = () => {
    cancelFocusEnd();
    if (phase === 'running' || phase === 'paused') track('focus_stopped', { minutes: timer.minutes });
    router.back();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable onPress={leave} accessibilityRole="button" accessibilityLabel={t('common.close')} hitSlop={12}>
          <ThemedText type="heading" themeColor="textSecondary">
            ✕
          </ThemedText>
        </Pressable>
      </View>

      <View style={styles.center}>
        <ThemedText type="subtitle" style={styles.centerText}>
          {habit.icon} {habit.name}
        </ThemedText>

        {phase === 'finished' ? (
          <>
            <Brote mood={planted ? 'celebrate' : 'happy'} size={140} />
            <ThemedText type="title" style={styles.centerText}>
              {planted ? t('focus.planted') : t('focus.timeUp')}
            </ThemedText>
          </>
        ) : (
          <ProgressRing
            progress={phase === 'setup' ? 0 : elapsedMs(timer, now) / (timer.minutes * 60_000)}
            size={260}
            stroke={14}
            color={color}
            track={theme.backgroundSelected}>
            <Brote mood={timer.phase === 'running' ? 'happy' : 'sleepy'} size={72} animated={timer.phase === 'running'} />
            <ThemedText style={[styles.clock, { color: theme.text }]}>{formatClock(left)}</ThemedText>
          </ProgressRing>
        )}

        {phase === 'setup' && (
          <View style={styles.chips} accessibilityRole="radiogroup">
            {(hasMinimum ? [2, ...DURATIONS] : DURATIONS).map((m) => {
              const selected = timer.minutes === m;
              return (
                <Pressable
                  key={m}
                  onPress={() => setTimer({ phase: 'setup', minutes: m })}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={m === 2 ? t('focus.minimumChip') : t('focus.minutes', { count: m })}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? color + '33' : theme.backgroundElement,
                      borderColor: selected ? color : 'transparent',
                    },
                  ]}>
                  <ThemedText type="smallBold">{m === 2 ? `🌱 2` : m}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.actions}>
        {phase === 'setup' && <Button label={`▶  ${t('focus.start')}`} onPress={() => start(timer.minutes)} />}

        {(phase === 'running' || phase === 'paused') && !stopping && (
          <View style={styles.row}>
            <Button
              style={styles.flex}
              variant="secondary"
              label={timer.phase === 'running' ? `⏸  ${t('focus.pause')}` : `▶  ${t('focus.resume')}`}
              onPress={timer.phase === 'running' ? pause : resume}
            />
            <Button style={styles.flex} variant="secondary" label={`⏹  ${t('focus.stop')}`} onPress={() => setStopping(true)} />
          </View>
        )}

        {stopping && phase !== 'finished' && (
          <View style={[styles.stopCard, { backgroundColor: theme.backgroundElement }]}>
            {elapsedMs(timer, now) >= MINIMUM_FOCUS_MS && !isDone(item) && (
              <Button label={`🌱  ${t('focus.countMinimum')}`} onPress={finishEarly} />
            )}
            <Button variant="secondary" label={t('focus.keepGoing')} onPress={() => setStopping(false)} />
            <Button variant="danger" label={t('focus.leave')} onPress={leave} />
          </View>
        )}

        {phase === 'finished' && !planted && (
          <Button label={`🌱  ${t('focus.plant')}`} onPress={() => plant(plantStatus)} />
        )}
        {phase === 'finished' && (
          <Button variant={planted ? 'primary' : 'secondary'} label={t('common.done')} onPress={() => router.back()} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
  },
  top: { alignItems: 'flex-end' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.four },
  centerText: { textAlign: 'center' },
  clock: { fontSize: 44, lineHeight: 52, fontFamily: FontFamily.black, fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: Spacing.two },
  chip: {
    minWidth: 52,
    height: 44,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: { gap: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
  stopCard: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.lg },
});
