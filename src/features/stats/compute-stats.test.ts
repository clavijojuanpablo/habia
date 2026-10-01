import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import { addDays } from '@/lib/recurrence';
import { DEFAULT_DAY_BANDS } from '@/lib/time/day-bands';

import { computeStats, monthDays } from './compute-stats';

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

function log(habitId: string, dayOffset: number, hour: number, status: HabitLog['status'] = 'done'): HabitLog {
  const at = addDays(TODAY, dayOffset);
  at.setHours(hour);
  return { habit_id: habitId, occurrence_at: at.toISOString(), status } as HabitLog;
}

describe('computeStats', () => {
  it('counts today with pending habits, and past days as settled', () => {
    const stats = computeStats([morningHabit, nightHabit], [log('m', 0, 7), log('m', -1, 7)], FROM, TODAY, DEFAULT_DAY_BANDS);
    expect(stats.today).toEqual({ due: 2, done: 1, ratio: 0.5 });
    const yesterday = stats.days[stats.days.length - 2];
    expect(yesterday).toMatchObject({ due: 2, done: 1, ratio: 0.5 });
  });

  it('excludes a day skipped on purpose from the ratio, like a rest day', () => {
    const stats = computeStats([morningHabit], [log('m', -1, 7, 'skipped')], FROM, TODAY, DEFAULT_DAY_BANDS);
    const yesterday = stats.days[stats.days.length - 2];
    expect(yesterday).toMatchObject({ due: 0, done: 0, ratio: null });
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

  it('rates each weekday over the last 8 weeks, Monday first, rest days left out', () => {
    // Today is a Monday. The past 3 weeks: done every day but Sundays, and the last Saturday (-2) was a rest day.
    const isSunday = (offset: number) => (((offset % 7) + 7) % 7) === 6;
    const done = Array.from({ length: 21 }, (_, i) => -(i + 1)).filter((d) => !isSunday(d) && d !== -2);
    const logs = [...done.map((d) => log('m', d, 7)), log('m', -2, 7, 'skipped')];
    const { weekdays } = computeStats([morningHabit], logs, FROM, TODAY, DEFAULT_DAY_BANDS);
    expect(weekdays).toHaveLength(7);
    expect(weekdays[6].done).toBe(0); // Sundays: never done
    expect(weekdays[1].ratio).toBe(1); // Tuesdays: always done
    expect(weekdays[5].due).toBe(weekdays[1].due - 1); // the rested Saturday is not due
  });
});

describe('monthDays', () => {
  it('covers a past month whole and the current one up to today', () => {
    const august = monthDays([morningHabit], [], new Date(2026, 7, 10), TODAY, DEFAULT_DAY_BANDS);
    expect(august).toHaveLength(31);
    expect(august[0].ratio).toBeNull(); // the habit only started on September 1

    const september = monthDays([morningHabit], [log('m', -1, 7)], TODAY, TODAY, DEFAULT_DAY_BANDS);
    expect(september).toHaveLength(21); // Sep 1 → today (the 21st)
    expect(september[19]).toMatchObject({ due: 1, done: 1 }); // yesterday
  });

  it('is empty for a month that has not started', () => {
    expect(monthDays([morningHabit], [], new Date(2026, 9, 1), TODAY, DEFAULT_DAY_BANDS)).toEqual([]);
  });
});
