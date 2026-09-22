import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import { addDays, occurrenceKey } from '@/lib/recurrence';

import { computeGarden, computeHabitGrowth, stageFor } from './compute-garden';

// "Now" is Monday 2026-09-21 at 10:00; the habit is daily, all-day.
const NOW = new Date(2026, 8, 21, 10, 0);
const TODAY = new Date(2026, 8, 21);

const habit = {
  id: 'h1',
  rrule: 'FREQ=DAILY',
  starts_on: '2026-09-01',
  window_start: null,
  window_end: null,
} as Habit;

/** Logs for the given day offsets relative to today (e.g. -1 = yesterday). */
function logsFor(offsets: number[]) {
  const map = new Map<string, HabitLog>();
  for (const offset of offsets) {
    const at = addDays(TODAY, offset);
    map.set(occurrenceKey('h1', at), { habit_id: 'h1', occurrence_at: at.toISOString(), status: 'done' } as HabitLog);
  }
  return map;
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

describe('computeHabitGrowth', () => {
  it('counts a streak of consecutive completions', () => {
    const growth = computeHabitGrowth(habit, logsFor([-3, -2, -1]), TODAY);
    expect(growth.streak).toBe(3);
    expect(growth.atRisk).toBe(false);
  });

  it('does not count today as missed while it is still pending', () => {
    expect(computeHabitGrowth(habit, logsFor([-2, -1]), TODAY).streak).toBe(2);
  });

  it('includes today once it is done', () => {
    expect(computeHabitGrowth(habit, logsFor([-1, 0]), TODAY).streak).toBe(2);
  });

  it('forgives a single miss (never miss twice)', () => {
    // done, done, MISS (-2), done (-1)
    const growth = computeHabitGrowth(habit, logsFor([-4, -3, -1]), TODAY);
    expect(growth.streak).toBe(3);
  });

  it('flags the habit at risk after one miss, without breaking the streak', () => {
    // done -3, -2, MISS yesterday
    const growth = computeHabitGrowth(habit, logsFor([-3, -2]), TODAY);
    expect(growth.atRisk).toBe(true);
    expect(growth.streak).toBe(2);
  });

  it('breaks the streak after two consecutive misses', () => {
    // done -5, -4, MISS -3, MISS -2, done -1
    expect(computeHabitGrowth(habit, logsFor([-5, -4, -1]), TODAY).streak).toBe(1);
  });

  it('measures 30-day consistency and automaticity toward 66', () => {
    const growth = computeHabitGrowth(habit, logsFor(range(-20, -1)), TODAY);
    // Habit started 2026-09-01 → 20 due days, all done.
    expect(growth.consistency).toBe(1);
    expect(growth.automaticity).toBeCloseTo(20 / 66);
  });

  it('gives a flower for each recent week with at least 80% consistency', () => {
    expect(computeHabitGrowth(habit, logsFor(range(-14, -1)), TODAY).flowers).toBe(2);
  });
});

describe('stageFor', () => {
  it.each([
    [0, 0, 0],
    [5, 0, 1],
    [25, 0, 2],
    [75, 0, 3],
    [75, 1, 4],
    [200, 0, 4],
  ])('%i votes, %i fruits → stage %i', (votes, fruits, stage) => {
    expect(stageFor(votes, fruits)).toBe(stage);
  });
});

describe('computeGarden', () => {
  it('lowers health for habits at risk but never below 30', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ ...habit, id: `h${i}` }) as Habit);
    expect(computeGarden(many, [], 0, NOW).health).toBe(30);
    expect(computeGarden([habit], [], 0, NOW).health).toBe(85);
  });
});
