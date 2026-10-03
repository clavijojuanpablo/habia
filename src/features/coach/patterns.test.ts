import { addDays, formatLocalDate, parseLocalDate } from '@/lib/recurrence';

import { findPatterns, habitDays, type DayStatus, type PatternHabit, type PatternLog } from './patterns';

const START = parseLocalDate('2026-09-01');
const dateAt = (i: number) => formatLocalDate(addDays(START, i));

/** Builds a habit's days from a string: d = done, m = missed, r = rest, . = not scheduled. */
const days = (pattern: string) =>
  new Map<string, DayStatus>(
    [...pattern].flatMap((c, i): [string, DayStatus][] =>
      c === '.' ? [] : [[dateAt(i), c === 'd' ? 'done' : c === 'r' ? 'rest' : 'missed']],
    ),
  );

describe('findPatterns', () => {
  it('finds habits that go together on the same day, once per pair', () => {
    const map = new Map([
      ['meditate', days('dddddmmmmmdddddmmmmm')],
      ['read', days('dddddmmmmmddddmmmmmm')],
    ]);
    const patterns = findPatterns(map);
    // Streaky weeks do not invent next-day effects: only the same-day link remains, one way.
    expect(patterns).toHaveLength(1);
    expect(patterns[0].kind).toBe('same_day');
    expect([patterns[0].from, patterns[0].to].sort()).toEqual(['meditate', 'read']);
    expect(patterns[0].withPercent - patterns[0].withoutPercent).toBeGreaterThanOrEqual(80);
  });

  it('finds what happens the day after', () => {
    // The gym is steady, except the day after a late night.
    const sleep = 'ddmddddmdddmddddmdddmdddmdd';
    const gym = [...sleep].map((_, i) => (i > 0 && sleep[i - 1] === 'm' ? 'm' : 'd')).join('');
    const map = new Map([
      ['sleep', days(sleep)],
      ['gym', days(gym)],
    ]);
    const next = findPatterns(map).find((p) => p.kind === 'next_day' && p.from === 'sleep');
    expect(next).toMatchObject({ to: 'gym', withPercent: 100, withoutPercent: 0 });
  });

  it('needs enough days on both sides, and a clear difference', () => {
    // Read is always done: there is no "without meditating" side to compare.
    expect(findPatterns(new Map([['meditate', days('dddddddddd')], ['read', days('dddddddddd')]]))).toEqual([]);
    // Same rate either way: no pattern.
    expect(
      findPatterns(new Map([['a', days('dmdmdmdmdmdmdmdmdmdm')], ['b', days('ddmmddmmddmmddmmddmm')]]), { minGap: 30 }).filter(
        (p) => p.kind === 'same_day',
      ),
    ).toEqual([]);
  });

  it('ignores rest days on both sides', () => {
    const map = new Map([
      ['a', days('rrrrrrrrrrdddddmmmmm')],
      ['b', days('ddddddddddrrrrrrrrrr')],
    ]);
    expect(findPatterns(map)).toEqual([]);
  });
});

describe('findPatterns on non-daily habits', () => {
  it('never reads a next-day effect into a habit that was not due the day before', () => {
    // 'to' is due every other day: there is never a done "yesterday" to compare from.
    const map = new Map([
      ['a', days('dmdmdmdmdmdmdmdmdmdmdmdm')],
      ['b', days('d.m.d.m.d.m.d.m.d.m.d.m.')],
    ]);
    expect(findPatterns(map).filter((p) => p.kind === 'next_day' && p.to === 'b')).toEqual([]);
  });
});

describe('habitDays', () => {
  const habit: PatternHabit = { id: 'h', rrule: 'FREQ=DAILY', starts_on: '2026-09-01', window_start: null, window_end: null };
  const log = (day: number, status: PatternLog['status']): PatternLog => ({
    habit_id: 'h',
    occurrence_at: addDays(START, day),
    status,
  });

  it('only has the days a weekly habit is due', () => {
    const weekly: PatternHabit = { ...habit, rrule: 'FREQ=WEEKLY;BYDAY=TU,TH' };
    // 2026-09-01 is a Tuesday: due on the 1st, 3rd, 8th and 10th.
    const result = habitDays([weekly], [log(0, 'done')], START, addDays(START, 10));
    expect([...result.get('h')!.keys()]).toEqual(['2026-09-01', '2026-09-03', '2026-09-08', '2026-09-10']);
    expect(result.get('h')!.get('2026-09-01')).toBe('done');
  });

  it('reads done, rest and missed days from the schedule and the logs', () => {
    const result = habitDays([habit], [log(0, 'done'), log(1, 'skipped'), log(3, 'done_minimum')], START, addDays(START, 4));
    expect([...result.get('h')!.entries()]).toEqual([
      ['2026-09-01', 'done'],
      ['2026-09-02', 'rest'],
      ['2026-09-03', 'missed'],
      ['2026-09-04', 'done'],
    ]);
  });
});
