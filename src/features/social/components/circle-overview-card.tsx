import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Shadow, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session-provider';
import { useTheme } from '@/hooks/use-theme';

import { useCircleHabitProgress, useSocialProfiles, type Circle, type CircleHabit } from '../api';
import { computeCircleHabit, todayTier } from '../circle-habit-streak';
import { SocialAvatar } from './social-avatar';

const MAX_FACES = 8;

/**
 * A circle at a glance on "Tus círculos": its habit and group streak, today's count in the
 * red / yellow / green of the circle screen, who already did it, and what is left for you.
 */
export function CircleOverviewCard({
  circle,
  memberIds,
  habit,
  isOwner,
  today,
}: {
  circle: Circle;
  memberIds: string[];
  habit: CircleHabit | undefined;
  isOwner: boolean;
  today: Date;
}) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/circle/[id]', params: { id: circle.id } })}
      accessibilityRole="button"
      accessibilityLabel={circle.name}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <View style={styles.header}>
        <View style={[styles.emojiTile, { backgroundColor: theme.lavenderSoft }]}>
          <ThemedText style={styles.emoji}>{circle.emoji}</ThemedText>
        </View>
        <View style={styles.flex}>
          <ThemedText type="heading" numberOfLines={1}>
            {circle.name}
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('social.circle.members', { count: memberIds.length })}
          </ThemedText>
        </View>
        <ThemedText type="heading" themeColor="textSecondary">
          ›
        </ThemedText>
      </View>

      {habit ? (
        <HabitToday habit={habit} memberIds={memberIds} today={today} />
      ) : (
        <View style={[styles.noHabit, { backgroundColor: theme.background }]}>
          <ThemedText type="small" themeColor="textSecondary">
            {t(isOwner ? 'social.circles.noHabitOwner' : 'social.circles.noHabitMember')}
          </ThemedText>
        </View>
      )}
    </Pressable>
  );
}

function HabitToday({ habit, memberIds, today }: { habit: CircleHabit; memberIds: string[]; today: Date }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { session } = useSession();
  const me = session?.user.id;
  const { data } = useCircleHabitProgress(habit.id, today);
  const profiles = useSocialProfiles(memberIds);
  const colorOf = (id: string) => profiles.data?.find((p) => p.user_id === id)?.color ?? theme.textSecondary;

  const group = data ? computeCircleHabit(data.members, data.days, habit.rrule, today) : null;
  const playing = group && (group.today.state === 'met' || group.today.state === 'pending');
  const tier = group ? todayTier(group.today.done, group.today.needed, group.today.active) : 'short';
  const tierColor = { short: theme.danger, met: theme.gold, great: theme.primary }[tier];
  const lit = group?.today.state === 'met';
  const joined = !!data?.members.some((m) => m.user_id === me);
  const iDidIt = !!group?.today.carriers.includes(me ?? '');
  const faces = [...(group?.ranking.all ?? [])].sort((a, b) => Number(b.doneToday) - Number(a.doneToday));

  return (
    <View style={styles.habit}>
      <View style={styles.habitRow}>
        <ThemedText style={styles.habitIcon}>{habit.icon}</ThemedText>
        <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
          {habit.name}
        </ThemedText>
        <View style={[styles.streak, { backgroundColor: lit ? theme.streakSoft : theme.backgroundSelected }]}>
          <ThemedText style={[styles.flame, !lit && styles.dim]}>🔥</ThemedText>
          <ThemedText style={[styles.streakNumber, { color: lit ? theme.streak : theme.textSecondary }]}>
            {group?.streak ?? '–'}
          </ThemedText>
        </View>
      </View>

      {playing && group && (
        <>
          <View style={styles.counterRow}>
            <ThemedText style={[styles.counter, { color: tierColor }]}>
              {group.today.done}/{group.today.active}
            </ThemedText>
            <ThemedText type="caption" style={[styles.flex, { color: tierColor }]}>
              {tier === 'short'
                ? t('social.circleHabit.todayShort', { count: group.today.needed - group.today.done })
                : tier === 'met'
                  ? t('social.circleHabit.todaySaved')
                  : t(
                      group.today.done === group.today.active
                        ? 'social.circleHabit.todayAll'
                        : 'social.circleHabit.todayGreat',
                    )}
            </ThemedText>
          </View>
          <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
            <View
              style={[
                styles.fill,
                { width: `${(group.today.done / Math.max(1, group.today.active)) * 100}%`, backgroundColor: tierColor },
              ]}
            />
          </View>
        </>
      )}

      {faces.length > 0 && (
        <View style={styles.faces}>
          {faces.slice(0, MAX_FACES).map((f) => (
            <View key={f.userId} style={!f.doneToday && styles.dim}>
              <SocialAvatar color={colorOf(f.userId)} size={30} />
            </View>
          ))}
        </View>
      )}

      {playing && (
        <ThemedText
          type="smallBold"
          style={{ color: iDidIt ? theme.primary : joined ? theme.text : theme.textSecondary }}>
          {iDidIt
            ? t('social.circles.youDid')
            : joined
              ? t('social.circles.yourTurn', { habit: habit.name })
              : t('social.circles.notJoined')}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three, boxShadow: Shadow.card },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  emojiTile: { width: 56, height: 56, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 30, lineHeight: 36 },
  flex: { flex: 1 },
  dim: { opacity: 0.35 },
  noHabit: { borderRadius: Radius.md, padding: Spacing.three },
  habit: { gap: Spacing.two },
  habitRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  habitIcon: { fontSize: 22, lineHeight: 28 },
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
  counterRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  counter: { fontSize: 26, lineHeight: 32, fontFamily: FontFamily.black },
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  faces: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
});
