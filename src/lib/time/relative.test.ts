import { timeAgo, timeUntil } from './relative';

const at = (iso: string) => new Date(iso);

describe('timeAgo', () => {
  const now = at('2026-10-02T15:00:00');

  it('says "now" under a minute', () => {
    expect(timeAgo(at('2026-10-02T14:59:30'), now)).toEqual({ key: 'now', count: 0 });
  });

  it('counts minutes, then hours within a day', () => {
    expect(timeAgo(at('2026-10-02T14:55:00'), now)).toEqual({ key: 'minutes', count: 5 });
    expect(timeAgo(at('2026-10-02T12:10:00'), now)).toEqual({ key: 'hours', count: 2 });
    // Across midnight but under a day: hours read better than "yesterday".
    expect(timeAgo(at('2026-10-01T23:00:00'), now)).toEqual({ key: 'hours', count: 16 });
  });

  it('uses calendar days after a full day', () => {
    expect(timeAgo(at('2026-10-01T09:00:00'), now)).toEqual({ key: 'yesterday', count: 1 });
    expect(timeAgo(at('2026-09-29T20:00:00'), now)).toEqual({ key: 'days', count: 3 });
  });

  it('switches to weeks from 7 days', () => {
    expect(timeAgo(at('2026-09-25T15:00:00'), now)).toEqual({ key: 'weeks', count: 1 });
    expect(timeAgo(at('2026-09-12T15:00:00'), now)).toEqual({ key: 'weeks', count: 2 });
  });
});

describe('timeUntil', () => {
  const now = at('2026-10-02T15:00:00');

  it('rounds minutes up and never says 0', () => {
    expect(timeUntil(at('2026-10-02T15:00:20'), now)).toEqual({ key: 'minutes', count: 1 });
    expect(timeUntil(at('2026-10-02T15:44:10'), now)).toEqual({ key: 'minutes', count: 45 });
    expect(timeUntil(at('2026-10-02T14:00:00'), now)).toEqual({ key: 'minutes', count: 1 });
  });

  it('rounds hours up', () => {
    expect(timeUntil(at('2026-10-02T17:10:00'), now)).toEqual({ key: 'hours', count: 3 });
  });
});
