import { addDays, formatLocalDate } from '@/lib/recurrence';

import { computeTip, NOVELTY_PENALTY, VARIANTS } from './compute-tip';
import { band, days, growth, input, pending, TODAY, week } from './test-fixtures';

describe('computeTip', () => {
  it('gives no tip without habits', () => {
    expect(computeTip(input({ growth: [] }))).toBeNull();
  });

  it('picks the highest-scoring insight: a fresh miss beats everything else', () => {
    const tip = computeTip(
      input({
        growth: [growth('a', { two_minute_version: null }, { trailingMisses: 1, consistency: 0.1, completions: 33 })],
        agenda: [pending('a')],
        weeks: [week(10, 5), week(10, 8)],
      }),
    );
    expect(tip).toMatchObject({ rule: 'never_miss_twice', key: 'never_miss_twice:a' });
  });

  it('does not call two misses in a row "an accident": the comeback rule speaks instead', () => {
    const tip = computeTip(
      input({
        growth: [growth('a', {}, { trailingMisses: 2 })],
        agenda: [pending('a')],
        days: days([
          [1, 1],
          [1, 0],
          [1, 0],
          [1, 0],
        ]),
      }),
    );
    expect(tip?.rule).toBe('comeback');
  });

  it('lets a recently shown insight step aside for a new one', () => {
    const data = input({
      growth: [growth('w', { two_minute_version: null }, { consistency: 0.2 })],
      bands: [band('morning', 10, 9), band('night', 10, 4)],
    });
    expect(computeTip(data)?.rule).toBe('add_minimum');

    const yesterday = formatLocalDate(addDays(TODAY, -1));
    expect(computeTip(data, [{ date: yesterday, key: 'add_minimum:w' }])?.rule).toBe('best_band');
    // Four days later the penalty is gone.
    expect(computeTip(data, [{ date: formatLocalDate(addDays(TODAY, -4)), key: 'add_minimum:w' }])?.rule).toBe(
      'add_minimum',
    );
    expect(NOVELTY_PENALTY).toBeGreaterThan(0);
  });

  it('never silences a fresh miss for novelty', () => {
    const data = input({ growth: [growth('a', {}, { trailingMisses: 1 })], agenda: [pending('a')] });
    const memory = [{ date: formatLocalDate(TODAY), key: 'never_miss_twice:a' }];
    expect(computeTip(data, memory)?.rule).toBe('never_miss_twice');
  });

  it('alternates the phrasing of the same insight day by day, and is stable within a day', () => {
    const data = input({ growth: [growth('a', {}, { completions: 33 })] });
    const today = computeTip(data);
    const again = computeTip(data);
    const tomorrow = computeTip({ ...data, today: addDays(TODAY, 1) });
    expect(today).toEqual(again);
    expect(today?.variant).toBeLessThan(VARIANTS);
    expect(tomorrow?.variant).not.toBe(today?.variant);
  });

  it('falls back to a science fact', () => {
    expect(computeTip(input())?.rule).toBe('fact');
  });
});
