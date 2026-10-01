import { addDays, formatLocalDate } from '@/lib/recurrence';

import { computeCircleHabit, neededFor, type CircleHabitDay, type CircleHabitMember } from './circle-habit-streak';

// Today is Wednesday 2026-09-23.
const TODAY = new Date(2026, 8, 23);
const day = (back: number) => formatLocalDate(addDays(TODAY, -back));
const LONG_AGO = day(90);

/** Days ending today, oldest first: D = done, S = rested on purpose, . = nothing. */
function marks(user: string, pattern: string): CircleHabitDay[] {
  const chars = pattern.split('');
  return chars.flatMap((c, i) =>
    c === '.' ? [] : [{ user_id: user, day: day(chars.length - 1 - i), done: c === 'D', skipped: c === 'S' }],
  );
}
const members = (...ids: string[]): CircleHabitMember[] => ids.map((user_id) => ({ user_id, joined_on: LONG_AGO }));

describe('neededFor', () => {
  it('asks everyone up to two, then half rounded up', () => {
    expect([1, 2, 3, 4, 5, 8].map(neededFor)).toEqual([1, 2, 2, 2, 3, 4]);
  });
});

describe('computeCircleHabit', () => {
  it('counts days where at least half did it', () => {
    const days = [...marks('a', 'DDD'), ...marks('b', 'D.D'), ...marks('c', '...'), ...marks('d', '.D.')];
    const result = computeCircleHabit(members('a', 'b', 'c', 'd'), days, 'FREQ=DAILY', TODAY);
    expect(result.streak).toBe(3);
    expect(result.today).toMatchObject({ done: 2, needed: 2, carriers: ['a', 'b'] });
  });

  it('needs both in a circle of two', () => {
    const days = [...marks('a', 'DD'), ...marks('b', 'D.')];
    const result = computeCircleHabit(members('a', 'b'), days, 'FREQ=DAILY', TODAY);
    expect(result.week[2].state).toBe('pending');
    expect(result.streak).toBe(1);
  });

  it('forgives one short day and resets after two', () => {
    const one = computeCircleHabit(
      members('a', 'b', 'c'),
      [...marks('a', 'DD.DD'), ...marks('b', 'DD.DD')],
      'FREQ=DAILY',
      TODAY,
    );
    expect(one.streak).toBe(4);
    const two = computeCircleHabit(
      members('a', 'b', 'c'),
      [...marks('a', 'D..DD'), ...marks('b', 'D..DD')],
      'FREQ=DAILY',
      TODAY,
    );
    expect(two.streak).toBe(2);
  });

  it('leaves people who rested out of the count', () => {
    // Three members, two rested yesterday: the one left did it, so the day is met.
    const days = [...marks('a', 'DD'), ...marks('b', 'SD'), ...marks('c', 'S.')];
    const result = computeCircleHabit(members('a', 'b', 'c'), days, 'FREQ=DAILY', TODAY);
    expect(result.week[1].state).toBe('met');
    expect(result.streak).toBe(2);
  });

  it('only counts people from the day they joined', () => {
    const late = [...members('a', 'b'), { user_id: 'c', joined_on: day(0) }];
    const days = [...marks('a', 'DD'), ...marks('b', 'DD')];
    const result = computeCircleHabit(late, days, 'FREQ=DAILY', TODAY);
    expect(result.streak).toBe(2);
    expect(result.rows[2].days[1]).toBe('future');
  });

  it('ignores days the habit is not scheduled', () => {
    // Mon/Wed only: Tuesday with nobody is neutral.
    const days = [...marks('a', 'D.D'), ...marks('b', 'D.D')];
    const result = computeCircleHabit(members('a', 'b'), days, 'FREQ=WEEKLY;BYDAY=MO,WE', TODAY);
    expect(result.week[1].state).toBe('off');
    expect(result.streak).toBe(2);
  });

  it('compares consistency on closed days, this week against last', () => {
    const days = [...marks('a', 'DDDDDDDDD'), ...marks('b', 'D.D.D.D..')];
    const result = computeCircleHabit(members('a', 'b'), days, 'FREQ=DAILY', TODAY);
    // This week, Mon–Tue closed: a 2 + b 1 of 4. Last week (patterns start on Tuesday): a 6 + b 3 of 14.
    expect(result.thisWeek).toBe(75);
    expect(result.lastWeek).toBe(64);
  });
});
