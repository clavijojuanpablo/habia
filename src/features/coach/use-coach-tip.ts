import { useEffect, useState } from "react";

import { useGarden } from "@/features/garden/use-garden";
import {
  isDone,
  isSkipped,
  type ScheduledItem,
} from "@/features/schedule/build-schedule";
import { useStats } from "@/features/stats/use-stats";
import { track } from "@/lib/analytics";
import { formatLocalDate } from "@/lib/recurrence";
import { storage } from "@/lib/storage";

import { computeTip, type CoachTip } from "./compute-tip";

const STORAGE_KEY = "habia.coach.today";

type DailyTip = { date: string; tip: CoachTip; dismissed: boolean };

function readDailyTip(date: string): DailyTip | null {
  try {
    const saved = JSON.parse(
      storage.getItem(STORAGE_KEY) ?? "null",
    ) as DailyTip | null;
    return saved?.date === date ? saved : null;
  } catch {
    return null;
  }
}

/**
 * Today's tip, picked once per day and kept: checking habits must not swap the
 * advice under the user's thumb. Reuses the garden and stats data (one cached request).
 */
export function useCoachTip(
  today: Date,
  todayItems: ScheduledItem[],
  itemsLoading: boolean,
) {
  const date = formatLocalDate(today);
  // `today`, not `now`: the tip is pinned once a day, no need to recompute the garden every minute.
  const garden = useGarden(today, today);
  const { stats, isLoading } = useStats(today);
  const [daily, setDaily] = useState(() => readDailyTip(date));
  // Picking before today's schedule arrives would miss "never miss twice" for the whole day.
  const ready = !garden.isLoading && !isLoading && !itemsLoading;

  // First render of the day with data loaded: pin the tip (adjusting state while rendering, not in an effect).
  const current = daily?.date === date ? daily : null;
  if (!current && ready) {
    const tip = computeTip({
      growth: garden.summary.habits,
      days: stats.days,
      bands: stats.bands,
      weeks: stats.weeks,
      pendingToday: todayItems
        .filter((item) => !isDone(item) && !isSkipped(item))
        .map((item) => item.habit.id),
      today,
    });
    if (tip) setDaily({ date, tip, dismissed: false });
  }

  useEffect(() => {
    if (current) storage.setItem(STORAGE_KEY, JSON.stringify(current));
  }, [current]);

  const shownRule = current && !current.dismissed ? current.tip.rule : null;
  useEffect(() => {
    if (shownRule) track("coach_tip_shown", { rule: shownRule });
  }, [shownRule, date]);

  const dismiss = () => {
    if (!current) return;
    setDaily({ ...current, dismissed: true });
    track("coach_tip_dismissed", { rule: current.tip.rule });
  };

  return { tip: current && !current.dismissed ? current.tip : null, dismiss };
}
