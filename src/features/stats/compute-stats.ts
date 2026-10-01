import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import { buildSchedule, isDone, isSkipped, type ScheduleBand, type ScheduledItem } from '@/features/schedule/build-schedule';
import { addDays, daysBetween, formatLocalDate, startOfWeek, weekdayIndex } from '@/lib/recurrence';
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
  /** Everything settled in the last 30 days: the headline consistency. */
  last30: Ratio;
  /** Completion rate per weekday (0 = Monday) over the last 8 weeks: which days are strong. */
  weekdays: Ratio[];
};

const WEEKS = 8;
const BAND_DAYS = 30;
const BAND_ORDER: ScheduleBand[] = ['morning', 'afternoon', 'night', 'anytime'];

function ratioOf(items: ScheduledItem[]): Ratio {
  const done = items.filter(isDone).length;
  return { due: items.length, done, ratio: items.length === 0 ? null : done / items.length };
}

/** One DayStat per day in [from, last], from items that already exclude rest days. */
function tallyDays(items: ScheduledItem[], from: Date, last: Date): DayStat[] {
  const byDay = new Map<string, ScheduledItem[]>();
  for (const item of items) {
    const key = formatLocalDate(item.at);
    const list = byDay.get(key);
    if (list) list.push(item);
    else byDay.set(key, [item]);
  }
  const days: DayStat[] = [];
  for (let d = from; d <= last; d = addDays(d, 1)) {
    days.push({ date: d, ...ratioOf(byDay.get(formatLocalDate(d)) ?? []) });
  }
  return days;
}

/**
 * Day-by-day completion for any calendar month (the heatmap), with the same rules as the
 * stats: rest days are neither due nor missed. Days after `today` are left out.
 */
export function monthDays(habits: Habit[], logs: HabitLog[], month: Date, today: Date, bands: DayBandConfig): DayStat[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const last = lastOfMonth < today ? lastOfMonth : today;
  if (last < first) return [];
  const items = buildSchedule(habits, logs, first, addDays(last, 1), bands).filter((item) => !isSkipped(item));
  return tallyDays(items, first, last);
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
  // A habit skipped on purpose is a rest day, not a miss: it never enters the ratios below.
  const items = buildSchedule(habits, logs, from, addDays(today, 1), bands).filter((item) => !isSkipped(item));
  const settled = items.filter((item) => item.at < today || isDone(item));

  const days = tallyDays(items, from, today);

  const currentWeek = startOfWeek(today);
  const weeks: WeekStat[] = Array.from({ length: WEEKS }, (_, i) => {
    const weekStart = addDays(currentWeek, -7 * (WEEKS - 1 - i));
    const weekEnd = addDays(weekStart, 7);
    return { weekStart, ...ratioOf(settled.filter((it) => it.at >= weekStart && it.at < weekEnd)) };
  });

  const recent = settled.filter((it) => daysBetween(it.at, today) <= BAND_DAYS);
  const bandStats = BAND_ORDER.map((band) => ({ band, ...ratioOf(recent.filter((it) => it.band === band)) })).filter(
    (b) => b.due > 0,
  );

  const sinceWeeks = addDays(currentWeek, -7 * (WEEKS - 1));
  const lastWeeks = settled.filter((it) => it.at >= sinceWeeks);
  const weekdays = Array.from({ length: 7 }, (_, weekday) =>
    ratioOf(lastWeeks.filter((it) => weekdayIndex(it.at) === weekday)),
  );

  return {
    days,
    today: ratioOf(items.filter((it) => it.at >= today)),
    thisWeek: weeks[weeks.length - 1],
    weeks,
    bands: bandStats,
    last30: ratioOf(recent),
    weekdays,
  };
}
