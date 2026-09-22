import type { DayStat } from '@/features/stats/compute-stats';
import { addDays, daysBetween, startOfWeek } from '@/lib/recurrence';

/**
 * The app-wide day streak (the 🔥 in the top bar).
 * - A day counts when at least one habit was completed (showing up beats perfection).
 * - Today never breaks the streak while it is still pending.
 * - Days with nothing scheduled are rest days: they neither count nor break.
 * - One missed day is forgiven ("never miss twice"); two in a row reset the streak.
 */

export type DayState = 'done' | 'forgiven' | 'missed' | 'rest' | 'pending' | 'future';

export const STREAK_MILESTONES = [3, 7, 14, 30, 66, 100, 365];

export type Streak = {
  current: number;
  record: number;
  /** First day of the current streak, if any. */
  startedOn: Date | null;
  /** Monday → Sunday of the current week. */
  week: { date: Date; state: DayState }[];
  todayDone: boolean;
  /** The next milestone to reach and the last one passed (0 if none). */
  nextMilestone: number;
  previousMilestone: number;
};

const isActive = (d: DayStat) => d.done > 0;
const isRest = (d: DayStat) => d.due === 0;

/** Walks days oldest → newest applying the forgiveness rule; returns each day's state and run length. */
function walk(days: DayStat[], today: Date) {
  const states = new Map<number, DayState>();
  let run = 0;
  let record = 0;
  let misses = 0;
  let startedOn: Date | null = null;
  const pendingMiss: DayStat[] = [];

  for (const day of days) {
    const isToday = daysBetween(day.date, today) === 0;
    if (isActive(day)) {
      if (run === 0) startedOn = day.date;
      run++;
      record = Math.max(record, run);
      // A single miss between two active days is forgiven.
      for (const m of pendingMiss) states.set(m.date.getTime(), 'forgiven');
      pendingMiss.length = 0;
      misses = 0;
      states.set(day.date.getTime(), 'done');
    } else if (isToday) {
      states.set(day.date.getTime(), 'pending');
    } else if (isRest(day)) {
      states.set(day.date.getTime(), 'rest');
    } else {
      misses++;
      states.set(day.date.getTime(), 'missed');
      if (misses >= 2) {
        run = 0;
        startedOn = null;
        pendingMiss.length = 0;
      } else if (run > 0) {
        pendingMiss.push(day);
      }
    }
  }
  // Yesterday missed once but the streak is still alive → shown as forgiven.
  if (run > 0) for (const m of pendingMiss) states.set(m.date.getTime(), 'forgiven');

  return { states, run, record, startedOn };
}

export function computeStreak(days: DayStat[], today: Date): Streak {
  const { states, run, record, startedOn } = walk(days, today);

  const monday = startOfWeek(today);
  const week = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(monday, i);
    const state: DayState = date > today ? 'future' : (states.get(date.getTime()) ?? 'rest');
    return { date, state };
  });

  const nextMilestone = STREAK_MILESTONES.find((m) => m > run) ?? run + 100;
  const previousMilestone = [...STREAK_MILESTONES].reverse().find((m) => m <= run) ?? 0;
  const todayStat = days.find((d) => daysBetween(d.date, today) === 0);

  return {
    current: run,
    record,
    startedOn,
    week,
    todayDone: !!todayStat && isActive(todayStat),
    nextMilestone,
    previousMilestone,
  };
}
