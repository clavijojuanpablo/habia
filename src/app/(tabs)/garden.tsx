import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { useLogs } from '@/features/checkins/api';
import { BranchCard, LooseSeeds, NoBranches } from '@/features/garden/components/branches';
import { GardenScene } from '@/features/garden/components/garden-scene';
import { computeBranches } from '@/features/garden/compute-branches';
import { GARDEN_WINDOW_DAYS } from '@/features/garden/compute-garden';
import { useGarden } from '@/features/garden/use-garden';
import { useHabits } from '@/features/habits/api';
import { Brote } from '@/features/mascot/brote';
import { useIdentities } from '@/features/identities/api';
import { isDone } from '@/features/schedule/build-schedule';
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

  // The garden is about identity, not numbers (those live in Progress): one card per branch,
  // then the habits that feed no branch yet, with a one-tap way to link them.
  const habits = useHabits();
  // Same range as the garden's own logs: served from the same cached request.
  const logsFrom = useMemo(() => addDays(today, -GARDEN_WINDOW_DAYS), [today]);
  const logs = useLogs(logsFrom, tomorrow);
  const { branches, loose } = useMemo(
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

  const pendingRatio = items.length === 0 ? 0 : items.filter((i) => !isDone(i)).length / items.length;
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

          {/* Stage + progress toward the next one, with Brote reacting to the tree's health */}
          <View style={[styles.header, { backgroundColor: theme.backgroundElement }]}>
            <View style={styles.headerRow}>
              <View style={styles.flex}>
                <ThemedText type="subtitle">{t(`garden.stage.${summary.stage}`)}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t('garden.votes', { count: summary.votes })}
                </ThemedText>
              </View>
              <Brote mood={summary.health < 100 ? 'happy' : 'cheer'} size={72} />
            </View>

            {nextStage && (
              <>
                <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
                  <View
                    style={[styles.fill, { width: `${stageProgress * 100}%`, backgroundColor: theme.primary }]}
                  />
                </View>
                <ThemedText type="caption" themeColor="textSecondary">
                  {t('garden.toNextStage', {
                    count: nextStage.votes - summary.votes,
                    stage: t(`garden.stageShort.${nextStage.stage}`),
                  })}
                </ThemedText>
              </>
            )}

            <ThemedText type="small" themeColor="textSecondary">
              {t(summary.health < 100 ? 'garden.healthLow' : 'garden.healthGood')}
            </ThemedText>
          </View>

          {isLoading && <ActivityIndicator color={theme.primary} />}
          {error && (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {t('common.error')}
            </ThemedText>
          )}

          <View style={styles.section}>
            <ThemedText type="subtitle">{t('garden.whoTitle')}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {t('garden.whoBody')}
            </ThemedText>
          </View>
          {identities.length === 0 ? (
            <NoBranches />
          ) : (
            branches.map((branch) => <BranchCard key={branch.identity.id} branch={branch} />)
          )}
          {identities.length > 0 && loose.length > 0 && <LooseSeeds habits={loose} identities={identities} />}
        </ScrollView>
      </SafeAreaView>
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
  scene: { height: SCENE_HEIGHT, borderRadius: Radius.xl, overflow: 'hidden' },
  header: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.lg, boxShadow: Shadow.card },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  track: { height: 10, borderRadius: 5, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 5 },
  section: { gap: Spacing.two },
});
