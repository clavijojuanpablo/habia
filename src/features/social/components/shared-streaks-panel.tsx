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

import { useCircles, useMySocialProfile, useSocialDays } from '../api';
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
            <CircleCard circle={circle} memberCount={ids.length} />
            {week && (
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
