import { shouldAskNorthStar } from './should-ask';

const TODAY = new Date(2026, 8, 30);
const daysAgo = (n: number) => new Date(2026, 8, 30 - n, 9, 0);

const ask = (overrides: Partial<Parameters<typeof shouldAskNorthStar>[0]> = {}) =>
  shouldAskNorthStar({ today: TODAY, onboardedAt: daysAgo(10), state: {}, analyticsOn: true, ...overrides });

describe('shouldAskNorthStar', () => {
  it('asks after a week of use', () => {
    expect(ask()).toBe(true);
    expect(ask({ onboardedAt: daysAgo(6) })).toBe(false);
  });

  it('never asks when analytics is off or the user has not onboarded', () => {
    expect(ask({ analyticsOn: false })).toBe(false);
    expect(ask({ onboardedAt: null })).toBe(false);
  });

  it('waits two weeks after an answer', () => {
    expect(ask({ state: { answeredOn: '2026-09-20' } })).toBe(false);
    expect(ask({ state: { answeredOn: '2026-09-16' } })).toBe(true);
  });

  it('respects "not now" until the snooze ends', () => {
    expect(ask({ state: { snoozedUntil: '2026-10-01' } })).toBe(false);
    expect(ask({ state: { snoozedUntil: '2026-09-30' } })).toBe(true);
  });
});
