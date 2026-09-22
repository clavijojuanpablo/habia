import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import { addDays } from '@/lib/recurrence';
import { DEFAULT_DAY_BANDS } from '@/lib/time/day-bands';

import { buildSchedule, nextInChain } from './build-schedule';

const TODAY = new Date(2026, 8, 21);
const TOMORROW = addDays(TODAY, 1);

function habit(overrides: Partial<Habit>): Habit {
  return {
    id: 'x',
    rrule: 'FREQ=DAILY',
    starts_on: '2026-09-01',
    window_start: null,
    window_end: null,
    cue_type: 'time',
    anchor_habit_id: null,
    ...overrides,
  } as Habit;
}

const coffee = habit({ id: 'coffee', window_start: '20:00:00' });
const study = habit({ id: 'study', cue_type: 'after_habit', anchor_habit_id: 'coffee' });
const review = habit({ id: 'review', cue_type: 'after_habit', anchor_habit_id: 'study' });
const read = habit({ id: 'read', window_start: '07:00:00' });

describe('buildSchedule with stacks', () => {
  it('shows a stacked habit in its anchor slot, right after it, keeping its own identity', () => {
    const items = buildSchedule([study, coffee, read], [], TODAY, TOMORROW, DEFAULT_DAY_BANDS);
    expect(items.map((i) => i.habit.id)).toEqual(['read', 'coffee', 'study']);

    const stacked = items[2];
    expect(stacked.band).toBe('night');
    expect(stacked.displayAt.getHours()).toBe(20);
    expect(stacked.hasTime).toBe(false); // identity unchanged: logs still match
    expect(stacked.at.getHours()).toBe(0);
  });

  it('resolves chains of any length from the root', () => {
    const items = buildSchedule([review, study, coffee], [], TODAY, TOMORROW, DEFAULT_DAY_BANDS);
    expect(items.map((i) => [i.habit.id, i.band])).toEqual([
      ['coffee', 'night'],
      ['study', 'night'],
      ['review', 'night'],
    ]);
  });

  it('falls back to "any time" when the anchor does not occur that day', () => {
    const weekendCoffee = { ...coffee, rrule: 'FREQ=WEEKLY;BYDAY=SA,SU' } as Habit; // TODAY is Monday
    const [item] = buildSchedule([study, weekendCoffee], [], TODAY, TOMORROW, DEFAULT_DAY_BANDS);
    expect(item.habit.id).toBe('study');
    expect(item.band).toBe('anytime');
    expect(item.anchorHabitId).toBeNull();
  });

  it('finds the next pending habit in the chain', () => {
    const items = buildSchedule([coffee, study], [], TODAY, TOMORROW, DEFAULT_DAY_BANDS);
    expect(nextInChain(items[0], items)?.habit.id).toBe('study');

    const doneStudy = { habit_id: 'study', occurrence_at: TODAY.toISOString(), status: 'done' } as HabitLog;
    const withDone = buildSchedule([coffee, study], [doneStudy], TODAY, TOMORROW, DEFAULT_DAY_BANDS);
    expect(nextInChain(withDone[0], withDone)).toBeUndefined();
  });
});
