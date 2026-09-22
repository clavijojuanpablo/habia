import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import { addDays } from '@/lib/recurrence';
import { DEFAULT_DAY_BANDS } from '@/lib/time/day-bands';

import { computeStats } from './compute-stats';

// Today is Monday 2026-09-21; habits started 2026-09-01.
const TODAY = new Date(2026, 8, 21);
const FROM = addDays(TODAY, -60);

const morningHabit = {
  id: 'm',
  rrule: 'FREQ=DAILY',
  starts_on: '2026-09-01',
  window_start: '07:00:00',
  window_end: null,
} as Habit;
const nightHabit = { ...morningHabit, id: 'n', window_start: '21:00:00' } as Habit;

function log(habitId: string, dayOffset: number, hour: number): HabitLog {
  const at = addDays(TODAY, dayOffset);
  at.setHours(hour);
  return { habit_id: habitId, occurrence_at: at.toISOString(), status: 'done' } as HabitLog;
}

describe('computeStats', () => {
  it('counts today with pending habits, and past days as settled', () => {
    const stats = computeStats([morningHabit, nightHabit], [log('m', 0, 7), log('m', -1, 7)], FROM, TODAY, DEFAULT_DAY_BANDS);
    expect(stats.today).toEqual({ due: 2, done: 1, ratio: 0.5 });
    const yesterday = stats.days[stats.days.length - 2];
    expect(yesterday).toMatchObject({ due: 2, done: 1, ratio: 0.5 });
  });

  it('marks days before the habits existed as having nothing due', () => {
    const stats = computeStats([morningHabit], [], FROM, TODAY, DEFAULT_DAY_BANDS);
    expect(stats.days[0].ratio).toBeNull();
  });

  it('does not count pending habits of today against this week', () => {
    // Monday: nothing done yet → the week has no settled occurrences.
    const stats = computeStats([morningHabit], [], FROM, TODAY, DEFAULT_DAY_BANDS);
    expect(stats.thisWeek.ratio).toBeNull();
    expect(stats.weeks).toHaveLength(8);
  });

  it('shows which day band succeeds more', () => {
    const logs = [-1, -2, -3, -4].map((d) => log('m', d, 7));
    const stats = computeStats([morningHabit, nightHabit], logs, FROM, TODAY, DEFAULT_DAY_BANDS);
    const byBand = Object.fromEntries(stats.bands.map((b) => [b.band, b.ratio]));
    expect(byBand.morning).toBeGreaterThan(byBand.night ?? 0);
    expect(byBand.night).toBe(0);
  });

  it('compounds the 1% index: full days go up, empty days go down', () => {
    const allDone = Array.from({ length: 20 }, (_, i) => log('m', -(i + 1), 7));
    const up = computeStats([morningHabit], allDone, FROM, TODAY, DEFAULT_DAY_BANDS).onePercent;
    const down = computeStats([morningHabit], [], FROM, TODAY, DEFAULT_DAY_BANDS).onePercent;

    expect(up.actual).toHaveLength(31);
    expect(up.actual[30]).toBeCloseTo(1.01 ** 20);
    expect(down.actual[30]).toBeCloseTo(0.99 ** 20);
    expect(up.ideal[30]).toBeCloseTo(1.01 ** 30);
  });
});
