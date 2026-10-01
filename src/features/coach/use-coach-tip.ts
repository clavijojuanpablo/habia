import { useEffect, useMemo, useState } from 'react';

import { useLogs } from '@/features/checkins/api';
import { GARDEN_WINDOW_DAYS } from '@/features/garden/compute-garden';
import { useGarden } from '@/features/garden/use-garden';
import { useHabits } from '@/features/habits/api';
import { isDone, isSkipped, type ScheduledItem } from '@/features/schedule/build-schedule';
import { useStats } from '@/features/stats/use-stats';
import { track } from '@/lib/analytics';
import { addDays, formatLocalDate } from '@/lib/recurrence';
import { storage } from '@/lib/storage';
import { getDayBand, type DayBand, type DayBandConfig } from '@/lib/time/day-bands';

import { computeTip } from './compute-tip';
import { buildHistory } from './history';
import type { CoachTip, ShownTip } from './types';

const PIN_KEY = 'habia.coach.pin';
const MEMORY_KEY = 'habia.coach.history';
const MEMORY_SIZE = 14;

/** The tip pinned for one day band: checking habits never swaps it under the user's thumb. */
type Pin = { date: string; band: DayBand; tip: CoachTip; dismissed: boolean };

function read<T>(key: string): T | null {
  try {
    return JSON.parse(storage.getItem(key) ?? 'null') as T | null;
  } catch {
    return null;
  }
}

type Options = {
  today: Date;
  now: Date;
  bandConfig: DayBandConfig;
  /** Today's schedule and whether it is still loading. */
  items: ScheduledItem[];
  itemsLoading: boolean;
  /** False while another prompt owns the slot above the list: nothing is pinned or shown. */
  enabled: boolean;
};

/**
 * The coach's tip for the current day band (up to three a day, so time-aware tips make
 * sense). Reuses the garden, stats and logs already cached for other screens.
 */
export function useCoachTip({ today, now, bandConfig, items, itemsLoading, enabled }: Options) {
  const date = formatLocalDate(today);
  const band = getDayBand(now.getHours(), bandConfig);
  // `today`, not `now`: the garden only needs the day; no need to recompute it every minute.
  const garden = useGarden(today, today);
  const { stats, isLoading } = useStats(today);
  const habits = useHabits();
  const from = useMemo(() => addDays(today, -GARDEN_WINDOW_DAYS), [today]);
  const to = useMemo(() => addDays(today, 1), [today]);
  const logs = useLogs(from, to);
  const history = useMemo(
    () => buildHistory(habits.data ?? [], logs.data ?? [], today),
    [habits.data, logs.data, today],
  );

  const [pin, setPin] = useState(() => read<Pin>(PIN_KEY));
  // Picking before today's schedule arrives would miss "never miss twice" for the whole band.
  const ready =
    enabled && !garden.isLoading && !isLoading && !itemsLoading && !habits.isLoading && !logs.isLoading;

  const pinned = pin?.date === date && pin.band === band ? pin : null;
  // "Never miss twice" loses its premise when the miss was only a forgotten log, caught up later
  // (YesterdayCatchUp). Doing the habit today keeps it: the card then shows the "done" variant.
  const tip = pinned?.tip;
  const stale =
    ready &&
    tip?.rule === 'never_miss_twice' &&
    garden.summary.habits.find((g) => g.habit.id === tip.habitId)?.trailingMisses === 0 &&
    !items.some((item) => item.habit.id === tip.habitId && isDone(item));
  const current = stale || !enabled ? null : pinned;

  // Pin a new tip when the band starts (adjusting state while rendering, not in an effect).
  if (!current && ready) {
    const next = computeTip(
      {
        growth: garden.summary.habits,
        history,
        days: stats.days,
        bands: stats.bands,
        weeks: stats.weeks,
        agenda: items
          .filter((item) => !isSkipped(item))
          .map((item) => ({ habitId: item.habit.id, band: item.band, pending: !isDone(item) })),
        bandConfig,
        today,
        now,
      },
      read<ShownTip[]>(MEMORY_KEY) ?? [],
    );
    if (next) setPin({ date, band, tip: next, dismissed: false });
  }

  // Persist the pin, and remember each newly pinned insight for the novelty penalty.
  useEffect(() => {
    if (!current) return;
    storage.setItem(PIN_KEY, JSON.stringify(current));
    const memory = read<ShownTip[]>(MEMORY_KEY) ?? [];
    if (!memory.some((m) => m.date === current.date && m.key === current.tip.key)) {
      const next = [...memory, { date: current.date, key: current.tip.key }].slice(-MEMORY_SIZE);
      storage.setItem(MEMORY_KEY, JSON.stringify(next));
    }
  }, [current]);

  const shownRule = current && !current.dismissed ? current.tip.rule : null;
  useEffect(() => {
    if (shownRule) track('coach_tip_shown', { rule: shownRule });
  }, [shownRule, date, band]);

  const dismiss = () => {
    if (!current) return;
    setPin({ ...current, dismissed: true });
    track('coach_tip_dismissed', { rule: current.tip.rule });
  };

  return { tip: current && !current.dismissed ? current.tip : null, dismiss };
}
