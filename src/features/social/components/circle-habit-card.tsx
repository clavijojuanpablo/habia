import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session-provider';
import { useTheme } from '@/hooks/use-theme';

import { SocialError, useCircleHabitProgress, useJoinCircleHabit, type CircleHabit, type SocialProfile } from '../api';
import { computeCircleHabit, RANKING_DAYS, todayTier } from '../circle-habit-streak';
import { ConsistencyRanking } from './consistency-ranking';
import { SocialAvatar } from './social-avatar';
import { SocialCard } from './social-card';

/**
 * A shared habit in a circle. First today: a big "3/8" that turns red → yellow → green as the
 * group saves the day, and everyone's face, lit once they did it. Then each person's consistency
 * as a ranking, and the group against last week.
 */
export function CircleHabitCard({
  habit,
  profiles,
  today,
}: {
  habit: CircleHabit;
  profiles: Record<string, SocialProfile>;
  today: Date;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { session } = useSession();
  const me = session?.user.id ?? '';
  const progress = useCircleHabitProgress(habit.id, today);
  const join = useJoinCircleHabit();

  if (!progress.data) {
    return (
      <SocialCard>
        <ThemedText type="heading">
          {habit.icon} {habit.name}
        </ThemedText>
        <ActivityIndicator color={theme.primary} />
      </SocialCard>
    );
  }

  const { members, days } = progress.data;
  const group = computeCircleHabit(members, days, habit.rrule, today);
  const joined = members.some((m) => m.user_id === me);
  const nameOf = (id: string) =>
    id === me ? t('social.circle.you') : (profiles[id]?.display_name ?? t('social.circle.hidden'));
  const colorOf = (id: string) => profiles[id]?.color ?? theme.primary;
  const trend = group.thisWeek === null || group.lastWeek === null ? null : group.thisWeek - group.lastWeek;
  const joinError = join.error instanceof SocialError ? join.error.code : join.error ? 'generic' : null;

  const { done, needed, active, state } = group.today;
  const playing = state === 'met' || state === 'pending';
  const tier = todayTier(done, needed, active);
  const tierColor = { short: theme.danger, met: theme.gold, great: theme.primary }[tier];
  const lit = state === 'met';

  return (
    <SocialCard>
      <View style={styles.header}>
        <ThemedText style={styles.icon}>{habit.icon}</ThemedText>
        <View style={styles.flex}>
          <ThemedText type="heading">{habit.name}</ThemedText>
          {habit.two_minute_version && (
            <ThemedText type="caption" themeColor="textSecondary">
              {t('social.circleHabit.minimum', { text: habit.two_minute_version })}
            </ThemedText>
          )}
        </View>
        <View style={[styles.streak, { backgroundColor: lit ? theme.streakSoft : theme.backgroundSelected }]}>
          <ThemedText style={[styles.flame, !lit && styles.dim]}>🔥</ThemedText>
          <ThemedText style={[styles.streakNumber, { color: lit ? theme.streak : theme.textSecondary }]}>
            {group.streak}
          </ThemedText>
        </View>
      </View>

      {/* Today */}
      {members.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {t('social.circleHabit.nobodyYet')}
        </ThemedText>
      ) : (
        <View style={[styles.board, { backgroundColor: playing ? tierColor + '1F' : theme.background }]}>
          {playing ? (
            <>
              <View style={styles.counterRow}>
                <ThemedText style={[styles.counter, { color: tierColor }]}>
                  {done}
                  <ThemedText style={[styles.counterTotal, { color: tierColor }]}>/{active}</ThemedText>
                </ThemedText>
                <ThemedText type="smallBold" style={[styles.flex, { color: tierColor }]}>
                  {tier === 'short'
                    ? t('social.circleHabit.todayShort', { count: needed - done })
                    : tier === 'met'
                      ? t('social.circleHabit.todaySaved')
                      : t('social.circleHabit.todayGreat')}
                </ThemedText>
              </View>
              <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                <View
                  style={[styles.fill, { width: `${(done / Math.max(1, active)) * 100}%`, backgroundColor: tierColor }]}
                />
                {/* Where the streak is saved: half of them. */}
                <View
                  style={[
                    styles.tick,
                    { left: `${(needed / Math.max(1, active)) * 100}%`, backgroundColor: theme.text },
                  ]}
                />
              </View>
            </>
          ) : (
            <ThemedText type="smallBold" themeColor="textSecondary">
              {t(state === 'rest' ? 'social.circleHabit.todayRest' : 'social.circleHabit.todayOff')}
            </ThemedText>
          )}
          <View style={styles.faces}>
            {/* Who already did it first, so the lit faces read together. */}
            {[...group.ranking]
              .sort((x, y) => Number(y.doneToday) - Number(x.doneToday))
              .map((r) => (
                <View key={r.userId} style={styles.face}>
                  <View style={!r.doneToday && styles.dim}>
                    <SocialAvatar color={colorOf(r.userId)} size={44} />
                  </View>
                  {r.doneToday && (
                    <View
                      style={[styles.check, { backgroundColor: theme.primary, borderColor: theme.backgroundElement }]}>
                      <ThemedText style={[styles.checkText, { color: theme.onPrimary }]}>✓</ThemedText>
                    </View>
                  )}
                  <ThemedText type="caption" numberOfLines={1} style={styles.faceName}>
                    {nameOf(r.userId)}
                  </ThemedText>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Consistency ranking */}
      {members.length > 0 && (
        <>
          <ThemedText type="smallBold">{t('social.circleHabit.rankingTitle', { count: RANKING_DAYS })}</ThemedText>
          <ConsistencyRanking
            rows={group.ranking.map((r) => ({
              userId: r.userId,
              name: nameOf(r.userId),
              color: colorOf(r.userId),
              percent: r.percent,
            }))}
          />
        </>
      )}

      {group.thisWeek !== null && (
        <View style={[styles.consistency, { backgroundColor: theme.background }]}>
          <ThemedText type="small" style={styles.flex}>
            {t('social.circleHabit.consistency', { percent: group.thisWeek })}
          </ThemedText>
          {trend !== null && trend !== 0 && (
            <ThemedText type="smallBold" style={{ color: trend > 0 ? theme.primary : theme.textSecondary }}>
              {trend > 0 ? '↑' : '↓'} {t('social.circleHabit.vsLastWeek', { percent: group.lastWeek })}
            </ThemedText>
          )}
        </View>
      )}

      {!joined && (
        <Button label={t('social.circleHabit.join')} loading={join.isPending} onPress={() => join.mutate(habit)} />
      )}
      {joinError && (
        <ThemedText type="small" themeColor="danger">
          {t(`social.errors.${joinError}`)}
        </ThemedText>
      )}
      <ThemedText type="caption" themeColor="textSecondary">
        {t('social.circleHabit.rule')}
      </ThemedText>
    </SocialCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  icon: { fontSize: 28, lineHeight: 34 },
  flex: { flex: 1 },
  dim: { opacity: 0.35 },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  flame: { fontSize: 24, lineHeight: 30 },
  streakNumber: { fontSize: 24, lineHeight: 30, fontFamily: FontFamily.black },
  board: { borderRadius: Radius.md, padding: Spacing.three, gap: Spacing.three },
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  counter: { fontSize: 40, lineHeight: 46, fontFamily: FontFamily.black },
  counterTotal: { fontSize: 22, lineHeight: 28, fontFamily: FontFamily.black },
  track: { height: 12, borderRadius: Radius.pill },
  fill: { height: '100%', borderRadius: Radius.pill },
  tick: { position: 'absolute', top: -3, width: 3, height: 18, borderRadius: 2, marginLeft: -1.5 },
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.three },
  face: { width: 56, alignItems: 'center', gap: Spacing.half },
  check: {
    position: 'absolute',
    top: 28,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: { fontSize: 12, lineHeight: 14, fontFamily: FontFamily.black },
  faceName: { textAlign: 'center', alignSelf: 'stretch' },
  consistency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.md,
  },
});
