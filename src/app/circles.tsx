import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { useCircleHabits, useCircles, useMySocialProfile } from '@/features/social/api';
import { CircleOverviewCard } from '@/features/social/components/circle-overview-card';
import { CirclesActions } from '@/features/social/components/circles';
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
                const members = circles.data.members.filter((m) => m.circle_id === circle.id);
                return (
                  <CircleOverviewCard
                    key={circle.id}
                    circle={circle}
                    memberIds={members.map((m) => m.user_id)}
                    habit={habitOf(circle.id)}
                    isOwner={members.some((m) => m.user_id === me.data?.user_id && m.role === 'owner')}
                    today={today}
                  />
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
  list: { gap: Spacing.three },
  empty: { alignItems: 'center' },
  center: { textAlign: 'center' },
});
