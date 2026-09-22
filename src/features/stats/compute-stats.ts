import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import { buildSchedule, isDone, type ScheduleBand, type ScheduledItem } from '@/features/schedule/build-schedule';
import { addDays, daysBetween, formatLocalDate, startOfWeek } from '@/lib/recurrence';
import type { DayBandConfig } from '@/lib/time/day-bands';

export type Ratio = { due: number; done: number; ratio: number | null };

export type DayStat = Ratio & { date: Date };
export type WeekStat = Ratio & { weekStart: Date };
export type BandStat = Ratio & { band: ScheduleBand };

export type Stats = {
  /** One entry per day in [from, today]; today includes pending habits in `due`. */
  days: DayStat[];
  today: Ratio;
  /** Current week so far (today counts only what is already done). */
  thisWeek: Ratio;
  /** Last 8 weeks, oldest first, current week last. */
  weeks: WeekStat[];
  /** Completion rate per day band over the last 30 days. */
  bands: BandStat[];
  /** 1% rule over the last 30 days: your index vs. improving 1% every day. */
  onePercent: { actual: number[]; ideal: number[] };
};

const WEEKS = 8;
const ONE_PERCENT_DAYS = 30;
const BAND_ORDER: ScheduleBand[] = ['morning', 'afternoon', 'night', 'anytime'];

function ratioOf(items: ScheduledItem[]): Ratio {
  const done = items.filter(isDone).length;
  return { due: items.length, done, ratio: items.length === 0 ? null : done / items.length };
}

/**
 * Aggregates habits × logs into the numbers the Progress screen shows.
 * A pending habit today is not a miss yet: past-looking stats only count today's done items.
 */
export function computeStats(
  habits: Habit[],
  logs: HabitLog[],
  from: Date,
  today: Date,
  bands: DayBandConfig,
): Stats {
  const items = buildSchedule(habits, logs, from, addDays(today, 1), bands);
  const settled = items.filter((item) => item.at < today || isDone(item));

  const byDay = new Map<string, ScheduledItem[]>();
  for (const item of items) {
    const key = formatLocalDate(item.at);
    const list = byDay.get(key);
    if (list) list.push(item);
    else byDay.set(key, [item]);
  }
  const days: DayStat[] = [];
  for (let d = from; d <= today; d = addDays(d, 1)) {
    days.push({ date: d, ...ratioOf(byDay.get(formatLocalDate(d)) ?? []) });
  }

  const currentWeek = startOfWeek(today);
  const weeks: WeekStat[] = Array.from({ length: WEEKS }, (_, i) => {
    const weekStart = addDays(currentWeek, -7 * (WEEKS - 1 - i));
    const weekEnd = addDays(weekStart, 7);
    return { weekStart, ...ratioOf(settled.filter((it) => it.at >= weekStart && it.at < weekEnd)) };
  });

  const recent = settled.filter((it) => daysBetween(it.at, today) <= ONE_PERCENT_DAYS);
  const bandStats = BAND_ORDER.map((band) => ({ band, ...ratioOf(recent.filter((it) => it.band === band)) })).filter(
    (b) => b.due > 0,
  );

  // Each settled day nudges the index by up to ±1%: all done → ×1.01, nothing done → ×0.99.
  const actual = [1];
  const ideal = [1];
  for (let n = ONE_PERCENT_DAYS; n >= 1; n--) {
    const day = days.find((d) => daysBetween(d.date, today) === n);
    const last = actual[actual.length - 1];
    actual.push(day?.ratio == null ? last : last * (1 + 0.01 * (2 * day.ratio - 1)));
    ideal.push(ideal[ideal.length - 1] * 1.01);
  }

  return {
    days,
    today: ratioOf(items.filter((it) => it.at >= today)),
    thisWeek: weeks[weeks.length - 1],
    weeks,
    bands: bandStats,
    onePercent: { actual, ideal },
  };
}
