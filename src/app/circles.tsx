import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import {
  useCircleHabitProgress,
  useCircleHabits,
  useCircles,
  useMySocialProfile,
  type Circle,
  type CircleHabit,
} from '@/features/social/api';
import { computeCircleHabit } from '@/features/social/circle-habit-streak';
import { CircleCard, CirclesActions } from '@/features/social/components/circles';
import { SocialCard } from '@/features/social/components/social-card';
import { UsernameSetup } from '@/features/social/components/username-setup';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';

/**
 * Your circles (the 🫂 in the top bar): each one is a habit done together with a group streak. A
 * circle of two is the streak with a friend. Circles are created and joined only here.
 */
export default function CirclesScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const { today } = useTodayRange(now);
  const me = useMySocialProfile();
  const circles = useCircles();
  const circleHabits = useCircleHabits();

  const memberCount = (circleId: string) => circles.data?.members.filter((m) => m.circle_id === circleId).length ?? 0;
  const habitOf = (circleId: string) => circleHabits.data?.find((h) => h.circle_id === circleId);

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        {(me.isLoading || circles.isLoading) && <ActivityIndicator color={theme.primary} />}
        {me.isSuccess && !me.data && <UsernameSetup />}

        {me.data && (
          <>
            {circles.data?.circles.length === 0 && (
              <SocialCard style={styles.empty}>
                <Brote mood="cheer" size={72} />
                <ThemedText type="heading" style={styles.center}>
                  {t('social.circles.emptyTitle')}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                  {t('social.circles.emptyBody')}
                </ThemedText>
              </SocialCard>
            )}
            <View style={styles.list}>
              {circles.data?.circles.map((circle) => {
                const habit = habitOf(circle.id);
                return habit ? (
                  <CircleWithStreak
                    key={circle.id}
                    circle={circle}
                    memberCount={memberCount(circle.id)}
                    habit={habit}
                    today={today}
                  />
                ) : (
                  <CircleCard key={circle.id} circle={circle} memberCount={memberCount(circle.id)} />
                );
              })}
            </View>
            <CirclesActions />
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

/** A circle with its habit's group streak on the card: the flame is lit once today is saved. */
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
        group ? { count: group.streak, lit: group.today.state === 'met', habit: `${habit.icon} ${habit.name}` } : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  list: { gap: Spacing.two },
  empty: { alignItems: 'center' },
  center: { textAlign: 'center' },
});
