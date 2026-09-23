import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { GardenScene } from '@/features/garden/components/garden-scene';
import { HabitGrowthRow } from '@/features/garden/components/habit-growth-row';
import { useGarden } from '@/features/garden/use-garden';
import { Brote } from '@/features/mascot/brote';
import { identityEmoji, useIdentities } from '@/features/identities/api';
import { isDone } from '@/features/schedule/build-schedule';
import { useSchedule } from '@/features/schedule/use-schedule';
import { TopBar } from '@/features/streak/components/top-bar';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { getDayBand } from '@/lib/time/day-bands';
import { skyProgress } from '@/lib/time/sky';

const SCENE_HEIGHT = 320;

export default function GardenScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const { today, tomorrow } = useTodayRange(now);
  const { summary, isLoading, error } = useGarden(today, now);
  const { items, bands } = useSchedule(today, tomorrow);
  const [width, setWidth] = useState(0);
  const { data: identities = [] } = useIdentities();
  const branchIdentities = useMemo(() => identities.map((i) => ({ id: i.id, color: i.color })), [identities]);

  // Cards grouped like the tree: one section per identity, then habits without one.
  const sections = [
    ...identities.map((identity) => ({
      key: identity.id,
      title: `${identityEmoji(identity)} ${identity.statement}`,
      habits: summary.habits.filter((g) => g.habit.identity_id === identity.id),
    })),
    {
      key: 'other',
      title: identities.length > 0 ? t('garden.otherHabits') : null,
      habits: summary.habits.filter((g) => !identities.some((i) => i.id === g.habit.identity_id)),
    },
  ].filter((section) => section.habits.length > 0);

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

          {sections.map((section) => (
            <View key={section.key} style={styles.section}>
              {section.title && <ThemedText type="heading">{section.title}</ThemedText>}
              {section.habits.map((growth) => (
                <HabitGrowthRow key={growth.habit.id} growth={growth} />
              ))}
            </View>
          ))}
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
