import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { WeeklyReviewHistory } from '@/features/coach/components/weekly-review-history';
import { useGarden } from '@/features/garden/use-garden';
import { useProfile } from '@/features/profile/api';
import { BandBars } from '@/features/stats/components/band-bars';
import { HighlightCards } from '@/features/stats/components/highlight-cards';
import { MonthHeatmap } from '@/features/stats/components/month-heatmap';
import { StatTile } from '@/features/stats/components/stat-tile';
import { WeekdayBars } from '@/features/stats/components/weekday-bars';
import { WeeklyColumns } from '@/features/stats/components/weekly-columns';
import { useHighlights } from '@/features/stats/use-highlights';
import { useStats } from '@/features/stats/use-stats';
import { TopBar } from '@/features/streak/components/top-bar';
import { useStreak } from '@/features/streak/use-streak';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';

/**
 * Progress answers three questions: how am I doing (summary, highlights), when do I do best
 * (calendar, weeks, weekdays, moments of the day) and what did Brote say (weekly reviews).
 */
export default function ProgressScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const { today } = useTodayRange(now);
  const { stats, isLoading, error } = useStats(today);
  const { summary } = useGarden(today);
  const { streak } = useStreak(today);
  const highlights = useHighlights(today, summary.habits);
  const { data: profile } = useProfile();

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
            <StatTile
              label={t('progress.streak')}
              value={String(streak.current)}
              caption={t('progress.streakCaption', { count: streak.current, record: streak.record })}
              emoji="🔥"
              tint="streakSoft"
              onPress={() => router.push('/streak')}
            />
            <StatTile
              label={t('progress.thisWeek')}
              value={stats.thisWeek.due === 0 ? '–' : `${stats.thisWeek.done}/${stats.thisWeek.due}`}
              caption={t('progress.thisWeekCaption')}
              emoji="📅"
              tint="lavenderSoft"
            />
            <StatTile
              label={t('progress.seeds')}
              value={String(summary.votes)}
              caption={t('progress.seedsCaption')}
              emoji="🌱"
              tint="primarySoft"
            />
          </View>

          <WeeklyReviewHistory />
          <HighlightCards highlights={highlights} />
          <MonthHeatmap today={today} joinedOn={profile ? new Date(profile.created_at) : null} />
          <WeeklyColumns weeks={stats.weeks} />
          <WeekdayBars weekdays={stats.weekdays} />
          {stats.bands.length > 0 && <BandBars bands={stats.bands} />}
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
