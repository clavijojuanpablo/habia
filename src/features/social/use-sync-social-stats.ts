import { useEffect, useMemo, useRef } from 'react';

import { useGarden } from '@/features/garden/use-garden';
import { useStats } from '@/features/stats/use-stats';
import { useStreak } from '@/features/streak/use-streak';
import { useNow, useTodayRange } from '@/hooks/use-now';

import { useMySocialProfile, usePublishStats, type SocialStats } from './api';

const sameStats = (a: Partial<SocialStats>, b: SocialStats) =>
  (Object.keys(b) as (keyof SocialStats)[]).every((key) => a[key] === b[key]);

/**
 * Keeps the snapshot friends see in step with what the user sees in Progress. It only writes when
 * a number changed and everything has loaded, so a cold start never publishes zeros. A failed write
 * (offline) is not retried in a loop: the next change of numbers tries again.
 */
export function SocialStatsSync() {
  const now = useNow();
  const { today } = useTodayRange(now);
  const { data: me } = useMySocialProfile();
  const { stats, isLoading: statsLoading } = useStats(today);
  const { summary, isLoading: gardenLoading } = useGarden(today);
  const {
    streak: { current, record },
    isLoading: streakLoading,
    isError: streakError,
  } = useStreak(today);
  const { mutate: publish } = usePublishStats();
  const attempted = useRef<string | null>(null);

  const snapshot = useMemo<SocialStats>(
    () => ({
      streak: current,
      record,
      consistency: stats.last30.ratio === null ? null : Math.round(stats.last30.ratio * 100),
      seeds: summary.votes,
      stage: summary.stage,
    }),
    [current, record, stats.last30.ratio, summary.votes, summary.stage],
  );

  const loading = statsLoading || gardenLoading || streakLoading || streakError;
  useEffect(() => {
    const key = JSON.stringify(snapshot);
    if (!me || loading || attempted.current === key || sameStats(me.stats, snapshot)) return;
    attempted.current = key;
    publish(snapshot);
  }, [me, loading, snapshot, publish]);
  return null;
}
