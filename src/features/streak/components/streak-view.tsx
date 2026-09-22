import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { WEEKDAYS } from '@/lib/recurrence';

import { STREAK_MILESTONES, type DayState, type Streak } from '../compute-streak';

type Props = { streak: Streak; onClose: () => void };

const DAY_EMOJI: Partial<Record<DayState, string>> = { done: '🔥', forgiven: '🛡️', rest: '💤' };

/** Full streak screen: hero flame, this week, next milestone, record and milestones. */
export function StreakView({ streak, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();

  // A gentle "breathing" flame.
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.set(
      withRepeat(
        withSequence(
          withTiming(1.08, { duration: 900, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [pulse]);
  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.get() }] }));

  // Matches the "Day X of Y" label: progress from zero toward the next milestone.
  const progress = Math.min(1, streak.current / streak.nextMilestone);
  const formatDate = (d: Date) => d.toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      {/* Hero: warm pastel glow behind the flame */}
      <View style={[styles.hero, { backgroundColor: theme.streakSoft }]}>
        <SafeAreaView edges={['top']} style={styles.heroInner}>
          <View style={styles.header}>
            <ThemedText type="subtitle">{t('streak.title')}</ThemedText>
            <Pressable
              onPress={onClose}
              accessibilityLabel={t('common.close')}
              hitSlop={8}
              style={[styles.close, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="heading">✕</ThemedText>
            </Pressable>
          </View>
          <Animated.Text style={[styles.flame, flameStyle, streak.current === 0 && styles.flameOff]}>🔥</Animated.Text>
          <ThemedText type="hero" style={{ color: theme.streak }}>
            {streak.current}
          </ThemedText>
          <ThemedText type="heading" style={{ color: theme.streak }}>
            {t('streak.days', { count: streak.current })}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
            {streak.todayDone ? t('streak.safeToday') : t('streak.keepItUp')}
          </ThemedText>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* This week */}
        <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.streakSoft }]}>
          <View style={styles.weekRow}>
            {streak.week.map(({ date, state }, i) => {
              const active = state === 'done';
              return (
                <View key={date.getTime()} style={styles.weekDay}>
                  <ThemedText type="caption" style={{ color: active ? theme.streak : theme.textSecondary }}>
                    {t(`weekdays.${WEEKDAYS[i]}`)}
                  </ThemedText>
                  <View
                    style={[
                      styles.dayTile,
                      { backgroundColor: active ? theme.streakSoft : theme.backgroundSelected },
                      state === 'pending' && { borderColor: theme.streak, borderStyle: 'dashed', borderWidth: 2 },
                    ]}>
                    <ThemedText style={[styles.dayEmoji, state === 'forgiven' && { opacity: 0.8 }]}>
                      {DAY_EMOJI[state] ?? ''}
                    </ThemedText>
                  </View>
                </View>
              );
            })}
          </View>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
            {t('streak.rule')}
          </ThemedText>
        </View>

        {/* Next milestone */}
        <ThemedText type="heading">{t('streak.challenge')}</ThemedText>
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.rowBetween}>
            <ThemedText type="smallBold">{t('streak.challengeName', { count: streak.nextMilestone })}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('streak.challengeProgress', { current: streak.current, total: streak.nextMilestone })}
            </ThemedText>
          </View>
          <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
            <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: theme.streak }]} />
          </View>
        </View>

        {/* Started / record */}
        <View style={[styles.card, styles.split, { backgroundColor: theme.backgroundElement }]}>
          <View style={styles.splitCell}>
            <ThemedText type="heading">{streak.startedOn ? formatDate(streak.startedOn) : '–'}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('streak.started')}
            </ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.splitCell}>
            <ThemedText type="heading">{t('streak.dayCount', { count: streak.record })}</ThemedText>
            <ThemedText type="caption" themeColor="textSecondary">
              {t('streak.record')}
            </ThemedText>
          </View>
        </View>

        {/* Milestones */}
        <ThemedText type="heading">{t('streak.milestones')}</ThemedText>
        {STREAK_MILESTONES.map((m) => {
          const reached = streak.record >= m;
          return (
            <View
              key={m}
              style={[styles.card, styles.milestone, { backgroundColor: theme.backgroundElement, opacity: reached ? 1 : 0.6 }]}>
              <View style={[styles.badge, { backgroundColor: reached ? theme.streakSoft : theme.backgroundSelected }]}>
                <ThemedText type="heading" style={{ color: reached ? theme.streak : theme.textSecondary }}>
                  {m}
                </ThemedText>
              </View>
              <View style={styles.flex}>
                <ThemedText type="smallBold">{t('streak.milestone', { count: m })}</ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {m === 66 ? t('streak.milestone66') : reached ? t('streak.reached') : t('streak.locked')}
                </ThemedText>
              </View>
              <ThemedText style={styles.dayEmoji}>{reached ? '🏅' : '🔒'}</ThemedText>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  hero: { borderBottomLeftRadius: 48, borderBottomRightRadius: 48, paddingBottom: Spacing.four },
  heroInner: { alignItems: 'center', paddingHorizontal: Spacing.three, gap: Spacing.half },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', alignSelf: 'stretch', paddingTop: Spacing.two },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  flame: { fontSize: 96, lineHeight: 112, marginTop: Spacing.two },
  flameOff: { opacity: 0.3 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two, boxShadow: Shadow.card, borderWidth: 2, borderColor: 'transparent' },
  weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay: { alignItems: 'center', gap: Spacing.one, flex: 1 },
  dayTile: { width: 40, height: 48, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  dayEmoji: { fontSize: 22, lineHeight: 28 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  track: { height: 14, borderRadius: 7, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7 },
  split: { flexDirection: 'row', alignItems: 'center' },
  splitCell: { flex: 1, alignItems: 'center', gap: 2 },
  divider: { width: 1.5, alignSelf: 'stretch' },
  milestone: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  badge: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
});
