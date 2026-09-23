import { addDays } from '@/lib/recurrence';

import { canLog, isBeforeStart } from './rules';

const NOW = new Date(2026, 8, 23, 14, 30);

describe('canLog', () => {
  it('allows today, even a habit scheduled later today', () => {
    expect(canLog(new Date(2026, 8, 23, 21, 0), NOW)).toBe(true);
    expect(canLog(new Date(2026, 8, 23, 7, 0), NOW)).toBe(true);
  });

  it('allows past days (catching up on a forgotten log)', () => {
    expect(canLog(addDays(NOW, -1), NOW)).toBe(true);
    expect(canLog(addDays(NOW, -30), NOW)).toBe(true);
  });

  it('blocks tomorrow and beyond', () => {
    expect(canLog(addDays(NOW, 1), NOW)).toBe(false);
    expect(canLog(addDays(NOW, 7), NOW)).toBe(false);
  });
});

describe('isBeforeStart', () => {
  const joined = new Date(2026, 8, 10);

  it('blocks days before the user joined', () => {
    expect(isBeforeStart(addDays(joined, -1), joined)).toBe(true);
  });

  it('allows the joining day and later', () => {
    expect(isBeforeStart(joined, joined)).toBe(false);
    expect(isBeforeStart(addDays(joined, 5), joined)).toBe(false);
  });
});
