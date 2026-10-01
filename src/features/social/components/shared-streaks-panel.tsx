import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { MilestoneTimeline } from '@/features/streak/components/milestone-timeline';
import { useTheme } from '@/hooks/use-theme';

import {
  useCircleHabitProgress,
  useCircleHabits,
  useCircles,
  useMySocialProfile,
  useSocialDays,
  type Circle,
  type CircleHabit,
} from '../api';
import { computeCircleHabit } from '../circle-habit-streak';
import { computeCircleWeek } from '../shared-days';
import type { useSharedStreaks } from '../use-shared-streaks';
import { CircleCard } from './circles';
import { FriendCard } from './friend-card';
import { SocialCard } from './social-card';

type FriendStreak = ReturnType<typeof useSharedStreaks>['friends'][number];

/** The streak screen's "With friends" tab: goals with your best partner, every friend, your circles. */
export function SharedStreaksPanel({
  friends,
  best,
  today,
  loading,
}: {
  friends: FriendStreak[];
  best: FriendStreak | undefined;
  today: Date;
  loading: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const me = useMySocialProfile();
  const circles = useCircles();
  const memberIds = useMemo(() => [...new Set(circles.data?.members.map((m) => m.user_id) ?? [])], [circles.data]);
  const days = useSocialDays(memberIds, today);
  const circleHabits = useCircleHabits();
  // The first shared habit is the circle's main one: its group streak stands for the circle here.
  const mainHabit = (circleId: string) => circleHabits.data?.find((h) => h.circle_id === circleId);

  if (loading || me.isLoading || circles.isLoading) return <ActivityIndicator color={theme.streak} />;
  if (me.isSuccess && !me.data) {
    return (
      <Empty
        title={t('streak.friends.noProfileTitle')}
        body={t('streak.friends.noProfileBody')}
        action={t('social.invite.pickUsername')}
      />
    );
  }
  if (friends.length === 0 && !circles.data?.circles.length) {
    return (
      <Empty
        title={t('streak.friends.emptyTitle')}
        body={t('streak.friends.emptyBody')}
        action={t('streak.friends.invite')}
      />
    );
  }

  return (
    <>
      {best?.shared && (
        <>
          <ThemedText type="heading">{t('streak.friends.goalsWith', { name: best.friend.display_name })}</ThemedText>
          <SocialCard>
            <MilestoneTimeline current={best.shared.current} />
          </SocialCard>
        </>
      )}

      {friends.length > 0 && <ThemedText type="heading">{t('social.friendsTitle')}</ThemedText>}
      {friends.map(({ friend, profile, shared }) => (
        <FriendCard
          key={friend.user_id}
          userId={friend.user_id}
          name={friend.display_name}
          username={friend.username}
          color={friend.color}
          profile={profile}
          shared={shared}
        />
      ))}

      {!!circles.data?.circles.length && <ThemedText type="heading">{t('social.circlesTitle')}</ThemedText>}
      {circles.data?.circles.map((circle) => {
        const ids = circles.data.members.filter((m) => m.circle_id === circle.id).map((m) => m.user_id);
        const week = days.data ? computeCircleWeek(ids, days.data, today) : null;
        return (
          <View key={circle.id} style={styles.circle}>
            {mainHabit(circle.id) ? (
              <CircleWithStreak circle={circle} memberCount={ids.length} habit={mainHabit(circle.id)!} today={today} />
            ) : (
              <CircleCard circle={circle} memberCount={ids.length} />
            )}
            {!mainHabit(circle.id) && week && (
              <ThemedText type="caption" themeColor="textSecondary" style={styles.indent}>
                {t('social.circle.allPlanted', { count: week.allPlanted })}
              </ThemedText>
            )}
          </View>
        );
      })}
    </>
  );
}

/** A circle with its main shared habit's group streak on the card: lit once today is saved. */
function CircleWithStreak({
  circle,
  memberCount,
  habit,
  today,
}: {
  circle: Circle;
  memberCount: number;
  habit: CircleHabit;
  today: Date;
}) {
  const { data } = useCircleHabitProgress(habit.id, today);
  const group = data ? computeCircleHabit(data.members, data.days, habit.rrule, today) : null;
  return (
    <CircleCard
      circle={circle}
      memberCount={memberCount}
      streak={
        group
          ? { count: group.streak, lit: group.today.state === 'met', habit: `${habit.icon} ${habit.name}` }
          : undefined
      }
    />
  );
}

function Empty({ title, body, action }: { title: string; body: string; action: string }) {
  return (
    <SocialCard style={styles.empty}>
      <Brote mood="cheer" size={72} />
      <ThemedText type="heading" style={styles.center}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {body}
      </ThemedText>
      <Button label={action} onPress={() => router.navigate('/profile')} />
    </SocialCard>
  );
}

const styles = StyleSheet.create({
  circle: { gap: Spacing.one },
  indent: { paddingHorizontal: Spacing.three },
  empty: { alignItems: 'center' },
  center: { textAlign: 'center' },
});
