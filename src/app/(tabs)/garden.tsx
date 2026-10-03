import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useLogs } from '@/features/checkins/api';
import { Button } from '@/components/button';
import { BroteChatEntry } from '@/features/coach/components/brote-chat-entry';
import { WeeklyReviewHistory } from '@/features/coach/components/weekly-review-history';
import { BranchCard, NoBranches } from '@/features/garden/components/branches';
import { GardenScene } from '@/features/garden/components/garden-scene';
import { computeBranches } from '@/features/garden/compute-branches';
import { GARDEN_WINDOW_DAYS } from '@/features/garden/compute-garden';
import { useGarden } from '@/features/garden/use-garden';
import { useHabits } from '@/features/habits/api';
import { useIdentities } from '@/features/identities/api';
import { isDone, isSkipped } from '@/features/schedule/build-schedule';
import { useSchedule } from '@/features/schedule/use-schedule';
import { TopBar } from '@/features/streak/components/top-bar';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { addDays, startOfWeek } from '@/lib/recurrence';
import { getDayBand } from '@/lib/time/day-bands';
import { skyProgress } from '@/lib/time/sky';

const SCENE_HEIGHT = 320;

export default function GardenScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const { today, tomorrow } = useTodayRange(now);
  const { summary, isLoading, error } = useGarden(today);
  const { items, bands } = useSchedule(today, tomorrow);
  const [width, setWidth] = useState(0);
  const { data: identities = [] } = useIdentities();
  const branchIdentities = useMemo(() => identities.map((i) => ({ id: i.id, color: i.color })), [identities]);

  // The garden is about identity, not numbers (those live in Progress): the tree with its stage
  // drawn on it, Brote's weekly words, then one card per branch. Linking habits happens when a
  // branch is created or edited.
  const habits = useHabits();
  // Same range as the garden's own logs: served from the same cached request.
  const logsFrom = useMemo(() => addDays(today, -GARDEN_WINDOW_DAYS), [today]);
  const logs = useLogs(logsFrom, tomorrow);
  const { branches } = useMemo(
    () => computeBranches(identities, habits.data ?? [], logs.data ?? [], startOfWeek(today)),
    [identities, habits.data, logs.data, today],
  );

  // Votes needed for each stage (mirrors stageFor in compute-garden).
  const STAGE_VOTES = [0, 5, 25, 75, 200] as const;
  const nextStage =
    summary.stage < 4 ? { stage: summary.stage + 1, votes: STAGE_VOTES[summary.stage + 1] } : null;
  const previousVotes = STAGE_VOTES[summary.stage];
  const stageProgress = nextStage
    ? Math.min(1, (summary.votes - previousVotes) / (nextStage.votes - previousVotes))
    : 1;

  // Rests on purpose are not pending: they never bring clouds.
  const countable = items.filter((i) => !isSkipped(i));
  const pendingRatio = countable.length === 0 ? 0 : countable.filter((i) => !isDone(i)).length / countable.length;
  const band = getDayBand(now.getHours(), bands);
  const progress = useMemo(() => skyProgress(now, bands), [now, bands]);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <TopBar />
        <ScrollView contentContainerStyle={styles.content}>
          <View
            style={[styles.scene, { backgroundColor: theme.backgroundElement }]}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {width > 0 && (
              <GardenScene
                summary={summary}
                identities={branchIdentities}
                band={band}
                skyProgress={progress}
                pendingRatio={pendingRatio}
                width={width}
                height={SCENE_HEIGHT}
              />
            )}
          </View>

          {/* The way to the next stage: stage and seeds above a thin bar, under the scene. */}
          <View style={styles.stage}>
            <View style={styles.stageRow}>
              <ThemedText type="smallBold" style={styles.flex}>
                {t(`garden.stage.${summary.stage}`)}
              </ThemedText>
              <ThemedText
                type="smallBold"
                themeColor="textSecondary"
                accessibilityLabel={t('garden.seeds', { count: summary.votes })}>
                🌱 {summary.votes}
                {nextStage ? ` / ${nextStage.votes}` : ''}
              </ThemedText>
            </View>
            {nextStage && (
              <>
                <View
                  style={[styles.track, { backgroundColor: theme.backgroundSelected }]}
                  accessibilityRole="progressbar"
                  accessibilityValue={{ min: 0, max: 100, now: Math.round(stageProgress * 100) }}>
                  <View
                    style={[styles.fill, { width: `${stageProgress * 100}%`, backgroundColor: theme.primary }]}
                  />
                </View>
                <ThemedText type="caption" themeColor="textSecondary">
                  {t('garden.toNextStage', {
                    count: nextStage.votes - summary.votes,
                    stage: t(`garden.stageInSentence.${nextStage.stage}`),
                  })}
                </ThemedText>
              </>
            )}
          </View>

          <BroteChatEntry />
          <WeeklyReviewHistory />

          {isLoading && <ActivityIndicator color={theme.primary} />}
          {error && (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {t('common.error')}
            </ThemedText>
          )}

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            {t('garden.whoTitle')}
          </ThemedText>
          {identities.length === 0 ? (
            <NoBranches />
          ) : (
            <>
              {branches.map((branch) => (
                <BranchCard key={branch.identity.id} branch={branch} />
              ))}
              <Button
                variant="secondary"
                label={`+ ${t('identity.new')}`}
                onPress={() => router.push('/identity/new')}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.four,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  scene: { height: SCENE_HEIGHT, borderRadius: Radius.xl, overflow: 'hidden' },
  stage: { gap: Spacing.one, paddingHorizontal: Spacing.one },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  sectionTitle: { marginTop: Spacing.two },
});
