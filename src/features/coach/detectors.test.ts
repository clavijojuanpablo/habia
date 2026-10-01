import { countComebacks, DETECTORS } from './detectors';
import { band, growth, input, NOW, occurrences, pending, range } from './test-fixtures';
import type { CoachInput, CoachRule } from './types';

const found = (data: CoachInput, rule: CoachRule) =>
  DETECTORS.flatMap((detect) => detect(data)).filter((c) => c.body.rule === rule);
const at = (hour: number, minute = 0) => new Date(2026, 8, 30, hour, minute);

describe('countComebacks', () => {
  const pattern = (done: boolean[]) => occurrences(done.map((d, i) => ({ offset: i - done.length, done: d })));

  it('counts the recent single misses that were followed by a completion', () => {
    expect(countComebacks(pattern([true, false, true, false, true, false]))).toBe(2);
  });

  it('stops at a miss that lasted longer than one occurrence', () => {
    expect(countComebacks(pattern([true, false, false, true, false, true]))).toBe(1);
  });
});

describe('never_miss_twice', () => {
  it('fires for a single miss with today still open, with the comeback history', () => {
    const history = occurrences([
      { offset: -4, done: true },
      { offset: -3 },
      { offset: -2, done: true },
      { offset: -1 },
    ]);
    const [c] = found(
      input({
        growth: [growth('a', {}, { trailingMisses: 1 })],
        history: [{ habit: growth('a').habit, occurrences: history }],
        agenda: [pending('a')],
      }),
      'never_miss_twice',
    );
    expect(c.body).toMatchObject({ habitId: 'a', minimum: 'one page', comebacks: 1 });
  });

  it('stays silent when the habit is not due today', () => {
    expect(found(input({ growth: [growth('a', {}, { trailingMisses: 1 })] }), 'never_miss_twice')).toHaveLength(0);
  });
});

describe('usual_time', () => {
  const checkins = (count: number, hour = 7, minute = 10) =>
    occurrences(range(-count, -1).map((offset) => ({ offset, done: true, at: [hour, minute] as [number, number] })));
  const data = (count: number, now = NOW) =>
    input({ history: [{ habit: growth('a').habit, occurrences: checkins(count) }], agenda: [pending('a')], now });

  it('notices a habit running late against its usual check-in time', () => {
    const [c] = found(data(6), 'usual_time');
    expect(c.body).toMatchObject({ habitId: 'a', minutes: 7 * 60 + 10, sample: 6 });
  });

  it('waits an hour past the usual time', () => {
    expect(found(data(6, at(8)), 'usual_time')).toHaveLength(0);
  });

  it('needs at least five same-day check-ins', () => {
    expect(found(data(4), 'usual_time')).toHaveLength(0);
  });

  it('stays silent for habits with several occurrences a day', () => {
    const data = input({
      history: [{ habit: growth('a').habit, occurrences: checkins(6) }],
      agenda: [pending('a'), { habitId: 'a', band: 'night', pending: true }],
    });
    expect(found(data, 'usual_time')).toHaveLength(0);
  });

  it('ignores late catch-ups logged on another day', () => {
    const late = checkins(6).map((o) => ({ ...o, loggedAt: new Date(o.at.getTime() + 30 * 3600_000) }));
    const data = input({ history: [{ habit: growth('a').habit, occurrences: late }], agenda: [pending('a')] });
    expect(found(data, 'usual_time')).toHaveLength(0);
  });
});

describe('weak_weekday', () => {
  // Today is a Wednesday: every past Wednesday missed, every other day done.
  const history = (weeks: number) =>
    occurrences(range(-7 * weeks, -1).map((offset) => ({ offset, done: offset % 7 !== 0 })));

  it('warns on the weekday this habit usually slips', () => {
    const data = input({ history: [{ habit: growth('a').habit, occurrences: history(4) }], agenda: [pending('a')] });
    const [c] = found(data, 'weak_weekday');
    expect(c.body).toMatchObject({ habitId: 'a', weekdayPercent: 0, averagePercent: 86, sample: 4 });
  });

  it('needs at least four of that weekday', () => {
    const data = input({ history: [{ habit: growth('a').habit, occurrences: history(3) }], agenda: [pending('a')] });
    expect(found(data, 'weak_weekday')).toHaveLength(0);
  });
});

describe('projection', () => {
  const data = (completions: number, recentDays: number) =>
    input({
      growth: [growth('a', {}, { completions })],
      history: [
        {
          habit: growth('a').habit,
          occurrences: occurrences(range(-recentDays, -1).map((offset) => ({ offset, done: true }))),
        },
      ],
    });

  it('dates the fruit from the recent pace', () => {
    // 28 completions in 28 days → 1 a day → 16 left → October 16.
    const [c] = found(data(50, 28), 'projection');
    expect(c.body).toMatchObject({ habitId: 'a', completions: 50, recent: 28, eta: '2026-10-16' });
  });

  it('stays silent too early, too far, or once the habit is a fruit', () => {
    expect(found(data(5, 28), 'projection')).toHaveLength(0);
    expect(found(data(20, 7), 'projection')).toHaveLength(0); // 46 left at 0.25/day → 184 days
    expect(found(data(66, 28), 'projection')).toHaveLength(0);
  });
});

describe('agenda', () => {
  const data = (now: Date) =>
    input({
      bands: [band('morning', 10, 9), band('night', 10, 3)],
      agenda: [pending('a'), pending('b'), pending('c', 'night'), pending('d', 'night')],
      now,
    });

  it('suggests front-loading a heavy day while the weakest band is still ahead', () => {
    const [c] = found(data(NOW), 'agenda');
    expect(c.body).toEqual({ rule: 'agenda', total: 4, band: 'night', count: 2, percent: 30 });
  });

  it('counts habits, not occurrences', () => {
    const repeated = input({
      bands: [band('morning', 10, 9), band('night', 10, 3)],
      agenda: [pending('a'), pending('b'), pending('c', 'night'), pending('c', 'night'), pending('d', 'night')],
    });
    expect(found(repeated, 'agenda')[0].body).toMatchObject({ total: 4 });
  });

  it('stays silent once the weakest band has started', () => {
    expect(found(data(at(20)), 'agenda')).toHaveLength(0);
  });
});

describe('minimum_saved', () => {
  const data = (minimums: number) =>
    input({
      growth: [growth('a', {}, { streak: 5 })],
      history: [
        {
          habit: growth('a').habit,
          occurrences: occurrences(range(-minimums, -1).map((offset) => ({ offset, minimum: true }))),
        },
      ],
    });

  it('celebrates the 2-minute version keeping a streak alive', () => {
    expect(found(data(3), 'minimum_saved')[0].body).toMatchObject({ habitId: 'a', count: 3, streak: 5 });
  });

  it('needs at least three minimum days', () => {
    expect(found(data(2), 'minimum_saved')).toHaveLength(0);
  });
});

describe('existing rules', () => {
  it.each([
    [33, 'half'],
    [62, 'close'],
    [66, 'fruit'],
  ])('marks the automaticity journey at %i completions (%s)', (completions, stage) => {
    expect(found(input({ growth: [growth('a', {}, { completions })] }), 'automaticity')[0].body).toMatchObject({
      completions,
      stage,
    });
  });

  it('suggests a 2-minute version first, then an implementation intention', () => {
    const weak = growth('w', { two_minute_version: null }, { consistency: 0.2 });
    expect(found(input({ growth: [weak] }), 'add_minimum')[0].body).toMatchObject({ habitId: 'w', percent: 20 });
    const noCue = growth('w', { implementation_intention: null }, { consistency: 0.2 });
    expect(found(input({ growth: [noCue] }), 'add_intention')).toHaveLength(1);
  });

  it('ignores low consistency built on too few occurrences', () => {
    const fresh = growth('a', { two_minute_version: null }, { consistency: 0, recentDue: 3 });
    expect(found(input({ growth: [fresh] }), 'add_minimum')).toHaveLength(0);
  });

  it('compares the best and worst day band when the gap is large', () => {
    const data = input({ bands: [band('morning', 10, 9), band('night', 10, 4), band('anytime', 2, 0)] });
    expect(found(data, 'best_band')[0].body).toEqual({
      rule: 'best_band',
      best: 'morning',
      worst: 'night',
      bestPercent: 90,
      worstPercent: 40,
    });
  });

  it('always offers a science fact that changes with the day', () => {
    const today = found(input(), 'fact')[0].body;
    const tomorrow = found(input({ today: new Date(2026, 9, 1) }), 'fact')[0].body;
    expect(today).not.toEqual(tomorrow);
  });
});
