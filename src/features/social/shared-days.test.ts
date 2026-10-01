import { addDays, formatLocalDate } from '@/lib/recurrence';

import { computeCircleWeek, computeSharedStreak, SHARED_WINDOW_DAYS, type DayMark } from './shared-days';
import { isValidUsername, normalizeUsername, suggestUsername } from './username';

// Today is Wednesday 2026-09-23.
const TODAY = new Date(2026, 8, 23);

/** Marks ending today from a pattern, oldest first: A=active, S=skipped (rest), .=nothing. */
function marks(userId: string, pattern: string): DayMark[] {
  const chars = pattern.split('');
  return chars.flatMap((c, i) => {
    if (c === '.') return [];
    const day = formatLocalDate(addDays(TODAY, i - (chars.length - 1)));
    return [{ user_id: userId, day, active: c === 'A', skipped: c === 'S' }];
  });
}

const shared = (me: string, them: string) => computeSharedStreak(marks('me', me), marks('them', them), TODAY);

describe('computeSharedStreak', () => {
  it('grows only on days both planted, today included', () => {
    expect(shared('..AAA', '..AAA').current).toBe(3);
    expect(shared('..AAA', '..AAA').week[2].state).toBe('both');
  });

  it('keeps the streak while today is pending', () => {
    const streak = shared('AAA.', 'AAAA');
    expect(streak.current).toBe(3);
    expect(streak.week[2].state).toBe('pending');
  });

  it('forgives one day where only one planted', () => {
    expect(shared('AA.AA', 'AAAAA').current).toBe(4);
    expect(shared('AA.AA', 'AAAAA').week[0].state).toBe('one');
  });

  it('resets after two days in a row without planting together', () => {
    expect(shared('AA..AA', 'AAA.AA').current).toBe(2);
  });

  it('never breaks on a rest on purpose from either', () => {
    expect(shared('AASSAA', 'AAAAAA').current).toBe(4);
    expect(shared('AASAA', 'AA.AA').current).toBe(4);
  });

  it('flags a run that reaches the start of the shared window', () => {
    const all = 'A'.repeat(SHARED_WINDOW_DAYS + 1);
    const streak = shared(all, all);
    expect(streak.current).toBe(SHARED_WINDOW_DAYS + 1);
    expect(streak.capped).toBe(true);
    expect(shared('AAA', 'AAA').capped).toBe(false);
  });

  it('marks future days of the week', () => {
    expect(
      shared('A', 'A')
        .week.slice(3)
        .every((d) => d.state === 'future'),
    ).toBe(true);
  });
});

describe('computeCircleWeek', () => {
  it('builds one row per member and counts days everyone planted', () => {
    const all = [...marks('a', 'AAA'), ...marks('b', 'ASA'), ...marks('c', 'AA.')];
    const { rows, allPlanted } = computeCircleWeek(['a', 'b', 'c'], all, TODAY);
    expect(rows.map((r) => r.days.slice(0, 3))).toEqual([
      ['active', 'active', 'active'],
      ['active', 'rest', 'active'],
      ['active', 'active', 'empty'],
    ]);
    expect(rows[0].days[3]).toBe('future');
    expect(allPlanted).toBe(1);
  });

  it('counts nothing for an empty circle', () => {
    expect(computeCircleWeek([], [], TODAY).allPlanted).toBe(0);
  });
});

describe('usernames', () => {
  it('normalizes what people type', () => {
    expect(normalizeUsername('  @Ana.Gómez ')).toBe('anagomez');
    expect(normalizeUsername('Juan_Pablo-03')).toBe('juan_pablo03');
  });

  it('validates the stored shape', () => {
    expect(isValidUsername('ana')).toBe(true);
    expect(isValidUsername('an')).toBe(false);
    expect(isValidUsername('Ana')).toBe(false);
    expect(isValidUsername('a'.repeat(21))).toBe(false);
  });

  it('suggests a valid name from the display name', () => {
    expect(suggestUsername('Juan Pablo')).toBe('juan_pablo');
    expect(isValidUsername(suggestUsername('Jo'))).toBe(true);
    expect(isValidUsername(suggestUsername('🌱'))).toBe(true);
  });
});
