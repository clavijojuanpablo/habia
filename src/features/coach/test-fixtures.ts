// Shared fake data for the coach's unit tests (not imported by the app).
import type { HabitGrowth } from '@/features/garden/compute-garden';
import type { Habit } from '@/features/habits/api';
import type { BandStat, DayStat, WeekStat } from '@/features/stats/compute-stats';
import { addDays } from '@/lib/recurrence';
import { DEFAULT_DAY_BANDS } from '@/lib/time/day-bands';

import type { PastOccurrence } from '@/lib/history';
import type { CoachInput } from './types';

/** Wednesday 2026-09-30, 10:00 (morning band with the default bands). */
export const TODAY = new Date(2026, 8, 30);
export const NOW = new Date(2026, 8, 30, 10, 0);

export function growth(id: string, habit: Partial<Habit> = {}, overrides: Partial<HabitGrowth> = {}): HabitGrowth {
  return {
    habit: {
      id,
      name: `Habit ${id}`,
      two_minute_version: 'one page',
      implementation_intention: 'after coffee',
      ...habit,
    } as Habit,
    completions: 10,
    recentCompletions: 5,
    streak: 3,
    atRisk: false,
    trailingMisses: 0,
    consistency: 0.8,
    recentDue: 20,
    automaticity: 0.2,
    flowers: 1,
    ...overrides,
  };
}

/** One DayStat per entry, ending today; each entry is [due, done]. */
export function days(entries: [number, number][]): DayStat[] {
  return entries.map(([due, done], i) => ({
    date: addDays(TODAY, i - entries.length + 1),
    due,
    done,
    ratio: due === 0 ? null : done / due,
  }));
}

export const band = (b: BandStat['band'], due: number, done: number): BandStat => ({
  band: b,
  due,
  done,
  ratio: done / due,
});
export const week = (due: number, done: number): WeekStat => ({
  weekStart: TODAY,
  due,
  done,
  ratio: due ? done / due : null,
});

type OccSpec = { offset: number; done?: boolean; minimum?: boolean; skipped?: boolean; at?: [number, number] };

/** Occurrences at day offsets from today; `at` is the [hour, minute] the check-in was tapped that day. */
export function occurrences(specs: OccSpec[]): PastOccurrence[] {
  return specs.map(({ offset, done = false, minimum = false, skipped = false, at }) => {
    const day = addDays(TODAY, offset);
    return {
      at: day,
      done: done || minimum,
      minimum,
      skipped,
      loggedAt: at ? new Date(day.getFullYear(), day.getMonth(), day.getDate(), at[0], at[1]) : null,
    };
  });
}

/** Daily done occurrences for the given offsets (e.g. range(-10, -1)). */
export const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

export function input(overrides: Partial<CoachInput> = {}): CoachInput {
  return {
    growth: [growth('a')],
    history: [],
    days: days([
      [2, 2],
      [2, 2],
      [2, 0],
    ]),
    bands: [],
    weeks: [],
    agenda: [],
    bandConfig: DEFAULT_DAY_BANDS,
    today: TODAY,
    now: NOW,
    ...overrides,
  };
}

/** Today's pending occurrence of a habit, for `agenda`. */
export const pending = (habitId: string, b: CoachInput['agenda'][number]['band'] = 'morning') => ({
  habitId,
  band: b,
  pending: true,
});
