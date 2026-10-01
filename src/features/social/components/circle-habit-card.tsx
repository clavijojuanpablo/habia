import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session-provider';
import { useTheme } from '@/hooks/use-theme';

import { SocialError, useCircleHabitProgress, useJoinCircleHabit, type CircleHabit, type SocialProfile } from '../api';
import { computeCircleHabit } from '../circle-habit-streak';
import { CircleWeekGrid } from './circles';
import { SocialCard } from './social-card';

/**
 * A shared habit in a circle: the group's streak (it holds while half of them do it), today's
 * count, everyone's week, the group's consistency against last week, and who watered for everyone.
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
  const trend = group.thisWeek === null || group.lastWeek === null ? null : group.thisWeek - group.lastWeek;
  const joinError = join.error instanceof SocialError ? join.error.code : join.error ? 'generic' : null;

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
        <View style={[styles.streak, { backgroundColor: theme.streakSoft }]}>
          <ThemedText type="heading">🔥 {group.streak}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('social.circleHabit.groupStreak')}
          </ThemedText>
        </View>
      </View>

      {(group.today.state === 'met' || group.today.state === 'pending') && (
        <ThemedText
          type="smallBold"
          style={{ color: group.today.state === 'met' ? theme.primary : theme.text }}>
          {group.today.state === 'met'
            ? t('social.circleHabit.todayMet', { done: group.today.done, total: members.length })
            : t('social.circleHabit.todayNeed', {
                done: group.today.done,
                count: group.today.needed - group.today.done,
              })}
        </ThemedText>
      )}
      {group.today.carriers.length > 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          💧 {t('social.circleHabit.carriers', { names: group.today.carriers.map(nameOf).join(', ') })}
        </ThemedText>
      )}

      {members.length > 0 ? (
        <CircleWeekGrid rows={group.rows} profiles={profiles} me={me} />
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          {t('social.circleHabit.nobodyYet')}
        </ThemedText>
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
  streak: {
    alignItems: 'center',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
  },
  consistency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    borderRadius: Radius.md,
  },
});
