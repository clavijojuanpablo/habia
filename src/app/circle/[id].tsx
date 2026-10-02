import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Share, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session-provider';
import {
  useCircleHabits,
  useCircles,
  useEndCircleHabit,
  useRegenerateCircleCode,
  useRemoveCircleMember,
  useSocialProfiles,
  type Circle,
} from '@/features/social/api';
import { useArchiveHabit, useHabits } from '@/features/habits/api';
import { CircleHabitCard } from '@/features/social/components/circle-habit-card';
import { circleInviteLink } from '@/features/social/components/circles';
import { SocialCard } from '@/features/social/components/social-card';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';

/** A circle and its one shared habit: today, everyone's consistency, the invite, and leaving or managing it. */
export default function CircleScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id, invite } = useLocalSearchParams<{ id: string; invite?: string }>();
  const { session } = useSession();
  const me = session?.user.id ?? '';
  const now = useNow();
  const { today } = useTodayRange(now);

  const circles = useCircles();
  const circleHabits = useCircleHabits();
  // One shared habit per circle (enforced by the database): another habit means another circle.
  const sharedHabit = circleHabits.data?.find((h) => h.circle_id === id);
  const circle = circles.data?.circles.find((c) => c.id === id);
  const members = useMemo(() => circles.data?.members.filter((m) => m.circle_id === id) ?? [], [circles.data, id]);
  const memberIds = useMemo(() => members.map((m) => m.user_id), [members]);
  const profiles = useSocialProfiles(memberIds);
  const remove = useRemoveCircleMember();
  const regenerate = useRegenerateCircleCode();
  const endHabit = useEndCircleHabit();
  const archive = useArchiveHabit();
  const { data: myHabits } = useHabits();
  const myLinkedHabit = sharedHabit ? myHabits?.find((h) => h.circle_habit_id === sharedHabit.id) : undefined;
  const [leaving, setLeaving] = useState(false);

  const profileById = Object.fromEntries((profiles.data ?? []).map((p) => [p.user_id, p]));
  const isOwner = members.some((m) => m.user_id === me && m.role === 'owner');

  const shareInvite = (target: Circle) =>
    Share.share({
      message: t('social.circle.shareMessage', { name: target.name, link: circleInviteLink(target.invite_code) }),
    });
  // Created from a friend's page: open the invite once, after the modal settles. The ref (not the
  // param) guards it: clearing the param re-runs the effect, and its cleanup must not cancel the share.
  const invited = useRef(false);
  useEffect(() => {
    if (invite !== '1' || !circle || invited.current) return;
    invited.current = true;
    setTimeout(() => {
      router.setParams({ invite: undefined });
      shareInvite(circle);
    }, 500);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invite, circle]);

  if (circles.isLoading) {
    return (
      <ThemedView style={[styles.flex, styles.centered]}>
        <ActivityIndicator color={theme.primary} />
      </ThemedView>
    );
  }
  // Just left: the refetch drops the circle before the screen closes; show nothing meanwhile.
  if (!circle && remove.isSuccess) return <ThemedView style={styles.flex} />;
  if (!circle) {
    return (
      <ThemedView style={[styles.flex, styles.centered]}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('social.circle.unavailable')}
        </ThemedText>
      </ThemedView>
    );
  }

  const others = members.filter((m) => m.user_id !== me);

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.emojiTile, { backgroundColor: theme.lavenderSoft }]}>
            <ThemedText style={styles.emoji}>{circle.emoji}</ThemedText>
          </View>
          <ThemedText type="subtitle" style={styles.center}>
            {circle.name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('social.circle.members', { count: members.length })}
          </ThemedText>
        </View>

        <View style={styles.sectionRow}>
          <ThemedText type="heading" style={styles.flex}>
            {t('social.circleHabit.title')}
          </ThemedText>
          {isOwner && !sharedHabit && (
            <Button
              variant="secondary"
              label={t('social.circleHabit.add')}
              onPress={() => router.push({ pathname: '/circle/habit-new', params: { circleId: circle.id } })}
            />
          )}
        </View>
        {!sharedHabit && (
          <ThemedText type="small" themeColor="textSecondary">
            {t(isOwner ? 'social.circleHabit.emptyOwner' : 'social.circleHabit.emptyMember')}
          </ThemedText>
        )}
        {sharedHabit && <CircleHabitCard habit={sharedHabit} profiles={profileById} today={today} isOwner={isOwner} />}
        {sharedHabit && isOwner && (
          <Button
            variant="danger"
            label={t('social.circleHabit.end')}
            loading={endHabit.isPending}
            onPress={() =>
              confirmAction(
                t('social.circleHabit.endConfirm', { name: sharedHabit.name }),
                () => endHabit.mutate(sharedHabit.id),
                {
                  ok: t('social.circleHabit.end'),
                  cancel: t('common.cancel'),
                },
              )
            }
          />
        )}

        <SocialCard>
          <ThemedText type="heading">✉️ {t('social.circle.inviteTitle')}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {t('social.circle.inviteBody')}
          </ThemedText>
          <View style={[styles.code, { backgroundColor: theme.background, borderColor: theme.border }]}>
            <ThemedText type="subtitle" selectable>
              {circle.invite_code}
            </ThemedText>
          </View>
          <Button
            label={t('social.circle.share')}
            onPress={() => shareInvite(circle)}
          />
          {isOwner && (
            <Button
              variant="secondary"
              label={t('social.circle.newCode')}
              loading={regenerate.isPending}
              onPress={() => regenerate.mutate(circle.id)}
            />
          )}
        </SocialCard>

        {isOwner && others.length > 0 && (
          <SocialCard>
            <ThemedText type="heading">{t('social.circle.manage')}</ThemedText>
            {others.map((m) => {
              const name = profileById[m.user_id]?.display_name ?? t('social.circle.hidden');
              return (
                <View key={m.user_id} style={styles.memberRow}>
                  <ThemedText type="smallBold" style={styles.flex} numberOfLines={1}>
                    {name}
                  </ThemedText>
                  <Button
                    variant="danger"
                    label={t('social.circle.remove')}
                    onPress={() =>
                      confirmAction(
                        t('social.circle.removeConfirm', { name }),
                        () => remove.mutate({ circleId: circle.id, userId: m.user_id }),
                        { ok: t('social.circle.remove'), cancel: t('common.cancel') },
                      )
                    }
                  />
                </View>
              );
            })}
          </SocialCard>
        )}

        {leaving && myLinkedHabit ? (
          // Your habit holds your seeds and history: leaving never deletes it, you choose.
          <SocialCard>
            <ThemedText type="heading">{t('social.circle.leaveHabitTitle', { name: circle.name })}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('social.circle.leaveHabitBody', { habit: myLinkedHabit.name })}
            </ThemedText>
            <Button
              label={t('social.circle.leaveKeep')}
              loading={remove.isPending && !archive.isPending}
              onPress={() => remove.mutate({ circleId: circle.id, userId: me }, { onSuccess: () => router.back() })}
            />
            <Button
              variant="secondary"
              label={t('social.circle.leaveArchive')}
              loading={archive.isPending}
              onPress={() =>
                // Leave first: if archiving then fails, the habit is only unlinked, never lost or stuck.
                remove.mutate(
                  { circleId: circle.id, userId: me },
                  {
                    onSuccess: () => {
                      archive.mutate(myLinkedHabit.id);
                      router.back();
                    },
                  },
                )
              }
            />
            <Button variant="danger" label={t('common.cancel')} onPress={() => setLeaving(false)} />
          </SocialCard>
        ) : (
          <Button
            variant="danger"
            label={t('social.circle.leave')}
            onPress={() =>
              myLinkedHabit
                ? setLeaving(true)
                : confirmAction(
                    t('social.circle.leaveConfirm', { name: circle.name }),
                    () => remove.mutate({ circleId: circle.id, userId: me }, { onSuccess: () => router.back() }),
                    { ok: t('social.circle.leave'), cancel: t('common.cancel') },
                  )
            }
          />
        )}
        {(remove.isError || regenerate.isError || endHabit.isError || archive.isError) && (
          <ThemedText type="small" themeColor="danger" style={styles.center}>
            {t('social.errors.generic')}
          </ThemedText>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: { alignItems: 'center', justifyContent: 'center', padding: Spacing.four },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: { alignItems: 'center', gap: Spacing.one },
  emojiTile: { width: 72, height: 72, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 40, lineHeight: 48 },
  center: { textAlign: 'center' },
  code: {
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
