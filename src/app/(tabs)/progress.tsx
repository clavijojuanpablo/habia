import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useGarden } from '@/features/garden/use-garden';
import { BandBars } from '@/features/stats/components/band-bars';
import { MonthHeatmap } from '@/features/stats/components/month-heatmap';
import { OnePercentChart } from '@/features/stats/components/one-percent-chart';
import { StatTile } from '@/features/stats/components/stat-tile';
import { WeeklyColumns } from '@/features/stats/components/weekly-columns';
import { useStats } from '@/features/stats/use-stats';
import { TopBar } from '@/features/streak/components/top-bar';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';

const percent = (ratio: number | null) => (ratio === null ? '–' : `${Math.round(ratio * 100)}%`);

export default function ProgressScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const { today } = useTodayRange(now);
  const { stats, isLoading, error } = useStats(today);
  const { summary } = useGarden(today, now);

  const bestStreak = summary.habits.reduce((best, g) => (g.streak > best.streak ? g : best), {
    streak: 0,
    habit: null as null | { icon: string; name: string },
  });

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <TopBar />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">{t('progress.title')}</ThemedText>

          {isLoading && <ActivityIndicator color={theme.primary} />}
          {error && (
            <ThemedText type="small" style={{ color: theme.danger }}>
              {t('common.error')}
            </ThemedText>
          )}

          <View style={styles.tiles}>
            <StatTile label={t('progress.today')} value={`${stats.today.done}/${stats.today.due}`} />
            <StatTile label={t('progress.thisWeek')} value={percent(stats.thisWeek.ratio)} />
            <StatTile
              label={t('progress.bestStreak')}
              value={String(bestStreak.streak)}
              caption={bestStreak.habit ? `${bestStreak.habit.icon} ${bestStreak.habit.name}` : undefined}
            />
            <StatTile label={t('progress.votes')} value={String(summary.votes)} />
          </View>

          <MonthHeatmap days={stats.days} today={today} />
          <WeeklyColumns weeks={stats.weeks} />
          {stats.bands.length > 0 && <BandBars bands={stats.bands} />}
          <OnePercentChart actual={stats.onePercent.actual} ideal={stats.onePercent.ideal} />
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
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
});
