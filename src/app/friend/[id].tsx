import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import {
  useBlockUser,
  useFriendships,
  useRemoveFriendship,
  useReportUser,
  useAcceptFriend,
  useSendFriendRequest,
  useSocialDays,
  useSocialProfiles,
  type ReportReason,
} from '@/features/social/api';
import { CheerRow } from '@/features/social/components/cheers';
import { SocialAvatar } from '@/features/social/components/social-avatar';
import { SocialCard } from '@/features/social/components/social-card';
import { WeekDots } from '@/features/social/components/week-dots';
import { computePersonWeek } from '@/features/social/shared-days';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';
import { daysBetween } from '@/lib/recurrence';

/** How a person's day reads in the week dots. */
const DAY_DOT = { active: 'full', rest: 'rest', empty: 'empty', future: 'future' } as const;
const REPORT_REASONS: ReportReason[] = ['offensive_name', 'harassment', 'spam', 'other'];

/** A friend (or circle mate): their numbers, the streak you share, cheers, and the safety actions. */
export default function FriendScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const now = useNow();
  const { today } = useTodayRange(now);

  const friendships = useFriendships();
  const profiles = useSocialProfiles([id]);
  const days = useSocialDays([id], today);
  const removeFriend = useRemoveFriendship();
  const block = useBlockUser();
  const report = useReportUser();
  const request = useSendFriendRequest();
  const accept = useAcceptFriend();
  const [reporting, setReporting] = useState(false);

  const profile = profiles.data?.[0];
  const friendship = friendships.data?.find((f) => f.user_id === id);
  const isFriend = friendship?.status === 'accepted';
  // A pending request (either way) does not connect you yet: no shared days, no cheers.
  // Without any friendship row, the profile is visible because you share a circle.
  const pending = friendship?.status === 'pending';
  const incoming = pending && friendship.incoming;
  const marks = useMemo(() => days.data ?? [], [days.data]);
  const theirWeek = useMemo(() => computePersonWeek(id, marks, today), [id, marks, today]);

  if (profiles.isLoading) {
    return (
      <ThemedView style={[styles.flex, styles.centered]}>
        <ActivityIndicator color={theme.primary} />
      </ThemedView>
    );
  }
  if (!profile) {
    return (
      <ThemedView style={[styles.flex, styles.centered]}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('social.friend.unavailable')}
        </ThemedText>
      </ThemedView>
    );
  }

  const name = profile.display_name;
  const { stats } = profile;
  const updatedAgo = profile.stats_updated_at ? daysBetween(new Date(profile.stats_updated_at), today) : null;
  const leave = () => router.back();

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <SocialAvatar color={profile.color} size={88} />
          <ThemedText type="subtitle" style={styles.center}>
            {name}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            @{profile.username}
          </ThemedText>
        </View>

        <View style={styles.tiles}>
          <Tile emoji="🔥" label={t('social.friend.streak')} value={stats.streak ?? '–'} />
          <Tile
            emoji="🎯"
            label={t('social.friend.consistency')}
            value={stats.consistency === null || stats.consistency === undefined ? '–' : `${stats.consistency}%`}
          />
          <Tile emoji="🌱" label={t('social.friend.seeds')} value={stats.seeds ?? '–'} />
          <Tile
            emoji="🌳"
            label={t('social.friend.tree')}
            value={stats.stage === undefined ? '–' : t(`garden.stageShort.${stats.stage}`)}
          />
        </View>
        {updatedAgo !== null && (
          <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
            {t('social.friend.updated', { count: Math.max(0, updatedAgo) })}
          </ThemedText>
        )}

        {pending ? (
          <SocialCard>
            <ThemedText type="small" themeColor="textSecondary">
              {t(incoming ? 'social.friend.pendingIncoming' : 'social.friend.pendingOutgoing', { name })}
            </ThemedText>
            {incoming && (
              <Button
                label={t('social.requests.accept')}
                loading={accept.isPending}
                onPress={() => accept.mutate(id)}
              />
            )}
          </SocialCard>
        ) : (
          <>
            <SocialCard>
              <ThemedText type="heading">📅 {t('social.friend.theirWeek', { name })}</ThemedText>
              {days.data && <WeekDots states={theirWeek.map((d) => DAY_DOT[d])} />}
              {isFriend ? (
                // Streaks with friends live in circles: a circle of two is a shared habit with a group streak.
                <Button
                  variant="secondary"
                  label={t('social.friend.circleTogether', { name })}
                  onPress={() => router.push({ pathname: '/circle/new', params: { friend: name } })}
                />
              ) : (
                <Button
                  variant="secondary"
                  label={t(request.data ? `social.add.result.${request.data}` : 'social.friend.addFriend')}
                  disabled={!!request.data}
                  loading={request.isPending}
                  onPress={() => request.mutate(profile.username)}
                />
              )}
            </SocialCard>

            <SocialCard>
              <ThemedText type="heading">💌 {t('social.cheer.title', { name })}</ThemedText>
              <CheerRow toUser={id} name={name} />
            </SocialCard>
          </>
        )}

        <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
          🔒 {t('social.friend.privacy', { name })}
        </ThemedText>

        <View style={styles.safety}>
          {isFriend && (
            <Button
              variant="danger"
              label={t('social.friend.remove')}
              onPress={() =>
                confirmAction(
                  t('social.friend.removeConfirm', { name }),
                  () => removeFriend.mutate(id, { onSuccess: leave }),
                  {
                    ok: t('social.friend.remove'),
                    cancel: t('common.cancel'),
                  },
                )
              }
            />
          )}
          <Button
            variant="danger"
            label={t('social.friend.block')}
            onPress={() =>
              confirmAction(t('social.friend.blockConfirm', { name }), () => block.mutate(id, { onSuccess: leave }), {
                ok: t('social.friend.block'),
                cancel: t('common.cancel'),
              })
            }
          />
          {report.isSuccess ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              {t('social.report.thanks')}
            </ThemedText>
          ) : reporting ? (
            <SocialCard>
              <ThemedText type="smallBold">{t('social.report.title', { name })}</ThemedText>
              {REPORT_REASONS.map((reason) => (
                <Button
                  key={reason}
                  variant="secondary"
                  label={t(`social.report.reasons.${reason}`)}
                  loading={report.isPending && report.variables?.reason === reason}
                  onPress={() => report.mutate({ reported: id, reason })}
                />
              ))}
            </SocialCard>
          ) : (
            <Button variant="danger" label={t('social.report.action')} onPress={() => setReporting(true)} />
          )}
          {(block.isError || removeFriend.isError || report.isError || accept.isError) && (
            <ThemedText type="small" themeColor="danger" style={styles.center}>
              {t('social.errors.generic')}
            </ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

function Tile({ emoji, label, value }: { emoji: string; label: string; value: string | number }) {
  const theme = useTheme();
  return (
    <View style={[styles.tile, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText style={styles.tileEmoji}>{emoji}</ThemedText>
      <ThemedText type="heading">{value}</ThemedText>
      <ThemedText type="caption" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
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
  center: { textAlign: 'center' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: { flexGrow: 1, flexBasis: '45%', alignItems: 'center', padding: Spacing.three, borderRadius: Radius.lg },
  tileEmoji: { fontSize: 22, lineHeight: 28 },
  safety: { gap: Spacing.two },
});
