import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { GardenScene } from '@/features/garden/components/garden-scene';
import { HabitGrowthRow } from '@/features/garden/components/habit-growth-row';
import { useGarden } from '@/features/garden/use-garden';
import { isDone } from '@/features/schedule/build-schedule';
import { useSchedule } from '@/features/schedule/use-schedule';
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

  const pendingRatio = items.length === 0 ? 0 : items.filter((i) => !isDone(i)).length / items.length;
  const band = getDayBand(now.getHours(), bands);
  const progress = useMemo(() => skyProgress(now, bands), [now, bands]);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <View
            style={[styles.scene, { backgroundColor: theme.backgroundElement }]}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
            {width > 0 && (
              <GardenScene
                summary={summary}
                band={band}
                skyProgress={progress}
                pendingRatio={pendingRatio}
                width={width}
                height={SCENE_HEIGHT}
              />
            )}
          </View>

          <View style={styles.header}>
            <ThemedText type="subtitle">{t(`garden.stage.${summary.stage}`)}</ThemedText>
            <ThemedText themeColor="textSecondary">{t('garden.votes', { count: summary.votes })}</ThemedText>
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

          {summary.habits.map((growth) => (
            <HabitGrowthRow key={growth.habit.id} growth={growth} />
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
  scene: { height: SCENE_HEIGHT, borderRadius: Spacing.four, overflow: 'hidden' },
  header: { gap: Spacing.one },
});
