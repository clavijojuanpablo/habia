import { addDays, formatLocalDate } from '@/lib/recurrence';

import {
  computeCircleHabit,
  neededFor,
  todayTier,
  type CircleHabitDay,
  type CircleHabitMember,
} from './circle-habit-streak';

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
  });

  it('ignores days the habit is not scheduled', () => {
    // Mon/Wed only: Tuesday with nobody is neutral.
    const days = [...marks('a', 'D.D'), ...marks('b', 'D.D')];
    const result = computeCircleHabit(members('a', 'b'), days, 'FREQ=WEEKLY;BYDAY=MO,WE', TODAY);
    expect(result.week[1].state).toBe('off');
    expect(result.streak).toBe(2);
  });
});

describe('todayTier', () => {
  it('is short below the threshold, met at it, great at 80 %+', () => {
    expect(todayTier(3, 4, 8)).toBe('short');
    expect(todayTier(4, 4, 8)).toBe('met');
    expect(todayTier(7, 4, 8)).toBe('great');
    expect(todayTier(0, 0, 0)).toBe('short');
  });
});

describe('ranking', () => {
  it('this week only counts from Monday', () => {
    // Wednesday: Mon and Tue closed. b did both, a only Tuesday.
    const days = [...marks('a', '.D.'), ...marks('b', 'DD.')];
    const { week } = computeCircleHabit(members('a', 'b'), days, 'FREQ=DAILY', TODAY).ranking;
    expect(week.map((r) => [r.userId, r.percent])).toEqual([
      ['b', 100],
      ['a', 50],
    ]);
  });

  it('orders people by their consistency, counting today only once done', () => {
    const days = [...marks('a', 'DDD.'), ...marks('b', 'DDDD'), ...marks('c', 'D.S.')];
    // Everyone joined three days ago.
    const joined = ['a', 'b', 'c'].map((user_id) => ({ user_id, joined_on: day(3) }));
    const ranking = computeCircleHabit(joined, days, 'FREQ=DAILY', TODAY).ranking.month;
    expect(ranking.map((r) => r.userId)).toEqual(['b', 'a', 'c']);
    expect(ranking[0]).toMatchObject({ percent: 100, doneToday: true });
    // a: 3 of 3 closed days, today not done yet (not counted). c: 1 of 2, the rest left out.
    expect(ranking[1].percent).toBe(100);
    expect(ranking[2].percent).toBe(50);
  });
});
