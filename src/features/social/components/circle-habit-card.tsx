import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session-provider';
import { useTheme } from '@/hooks/use-theme';
import { showNotice } from '@/lib/confirm';
import { formatLocalDate } from '@/lib/recurrence';

import {
  SocialError,
  useCircleHabitPhotos,
  useCircleHabitProgress,
  useJoinCircleHabit,
  type CircleHabit,
  type SocialProfile,
} from '../api';
import { computeCircleHabit, todayTier, type RankingPeriod } from '../circle-habit-streak';
import { enqueueHabitPhoto, takeHabitPhoto } from '../photos';
import { ConsistencyRanking } from './consistency-ranking';
import { PhotoViewer } from './photo-viewer';
import { SocialAvatar } from './social-avatar';
import { SocialCard } from './social-card';

/** The viewer's fade-out, so the camera opens once the modal is gone. */
const RETAKE_DELAY_MS = 400;

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
  const [period, setPeriod] = useState<RankingPeriod>('month');
  const queryClient = useQueryClient();
  const day = formatLocalDate(today);
  const photos = useCircleHabitPhotos(habit.id, day);
  const photoOf = (userId: string) => photos.data?.find((p) => p.user_id === userId);
  // By id, so the viewer shows the photo as it is now (a vote, a report that hides it).
  const [viewingId, setViewingId] = useState<string | null>(null);
  const viewing = photos.data?.find((p) => p.id === viewingId) ?? null;
  const [uploading, setUploading] = useState(false);

  // Your photo of today: taken now with the camera, sent (or queued) and shown once it arrives.
  const addPhoto = async () => {
    const photo = await takeHabitPhoto().catch(() => null);
    if (photo?.status !== 'ok') {
      if (photo?.status === 'denied') showNotice(t('photos.cameraDenied'));
      return;
    }
    setUploading(true);
    try {
      const result = await enqueueHabitPhoto({
        circleId: habit.circle_id,
        circleHabitId: habit.id,
        userId: me,
        day,
        base64: photo.base64,
      });
      if (result !== 'sent') showNotice(t(result === 'queued' ? 'photos.queued' : 'photos.notSent'));
    } catch {
      showNotice(t('photos.failed'));
    } finally {
      setUploading(false);
      queryClient.invalidateQueries({ queryKey: ['social'] });
    }
  };
  // iOS cannot open the camera while the viewer's modal is still on screen: close it, then open.
  const retake = () => {
    setViewingId(null);
    setTimeout(addPhoto, RETAKE_DELAY_MS);
  };

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
  // Anyone else opens their profile, where you can add them as a friend.
  const openPerson = (id: string) => router.push({ pathname: '/friend/[id]', params: { id } });
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

      {/* Today's photos first: the proof is the picture. */}
      {!!photos.data?.length && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
          {photos.data.map((photo) => (
            <Pressable
              key={photo.id}
              onPress={() => setViewingId(photo.id)}
              accessibilityRole="button"
              accessibilityLabel={t('photos.of', { name: nameOf(photo.user_id) })}
              style={styles.galleryItem}>
              <Image
                source={{ uri: photo.url }}
                style={[styles.galleryPhoto, { borderColor: photo.doubted ? theme.gold : colorOf(photo.user_id) }]}
              />
              <ThemedText type="caption" numberOfLines={1} style={styles.faceName}>
                {photo.doubted ? '🤔 ' : ''}
                {nameOf(photo.user_id)}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      )}

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
                      : t(done === active ? 'social.circleHabit.todayAll' : 'social.circleHabit.todayGreat')}
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
            {[...group.ranking.all]
              .sort((x, y) => Number(y.doneToday) - Number(x.doneToday))
              .map((r) => (
                <Pressable
                  key={r.userId}
                  disabled={r.userId === me}
                  onPress={() => openPerson(r.userId)}
                  accessibilityRole="button"
                  accessibilityLabel={nameOf(r.userId)}
                  style={styles.face}>
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
                </Pressable>
              ))}
          </View>
        </View>
      )}

      {/* Consistency ranking */}
      {members.length > 0 && (
        <>
          <View style={styles.rankingHeader}>
            <ThemedText type="smallBold" style={styles.flex}>
              {t('social.circleHabit.rankingTitle')}
            </ThemedText>
          </View>
          <View style={[styles.periods, { backgroundColor: theme.background }]} accessibilityRole="tablist">
            {(['week', 'month', 'all'] as const).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                accessibilityRole="tab"
                accessibilityState={{ selected: period === p }}
                style={[styles.period, period === p && { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="caption" style={{ color: period === p ? theme.text : theme.textSecondary }}>
                  {t(`social.circleHabit.periods.${p}`)}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          <ConsistencyRanking
            key={period}
            onPress={(id) => id !== me && openPerson(id)}
            rows={group.ranking[period].map((r) => ({
              userId: r.userId,
              name: nameOf(r.userId),
              color: colorOf(r.userId),
              percent: r.percent,
            }))}
          />
        </>
      )}

      {joined && group.today.carriers.includes(me) && !photoOf(me) && photos.isSuccess && (
        <Button variant="secondary" label={`📸 ${t('photos.add')}`} loading={uploading} onPress={addPhoto} />
      )}
      {habit.photo_required && (
        <ThemedText type="caption" themeColor="textSecondary">
          📸 {t('photos.requiredHint')}
        </ThemedText>
      )}
      <PhotoViewer
        key={viewing?.id}
        photo={viewing}
        name={viewing ? nameOf(viewing.user_id) : ''}
        mine={viewing?.user_id === me}
        onRetake={retake}
        onClose={() => setViewingId(null)}
      />

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
  gallery: { gap: Spacing.two },
  galleryItem: { width: 100, gap: Spacing.half },
  galleryPhoto: { width: 100, height: 130, borderRadius: Radius.md, borderWidth: 3 },
  faceName: { textAlign: 'center', alignSelf: 'stretch' },
  rankingHeader: { flexDirection: 'row', alignItems: 'center' },
  periods: { flexDirection: 'row', padding: Spacing.half, borderRadius: Radius.pill },
  period: { flex: 1, alignItems: 'center', paddingVertical: Spacing.one, borderRadius: Radius.pill },
});
