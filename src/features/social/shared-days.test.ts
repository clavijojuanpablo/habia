import { addDays, formatLocalDate } from '@/lib/recurrence';

import { computePersonWeek, type DayMark } from './shared-days';
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


describe('computePersonWeek', () => {
  it('marks planted, rested, empty and future days', () => {
    const week = computePersonWeek('a', [...marks('a', 'AS.'), ...marks('b', 'AAA')], TODAY);
    expect(week).toEqual(['active', 'rest', 'empty', 'future', 'future', 'future', 'future']);
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
