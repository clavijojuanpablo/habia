import { growth, occurrences, range, TODAY } from '@/features/coach/test-fixtures';

import { computeHighlights } from './highlights';

const history = (id: string, done: number[], missed: number[] = []) => ({
  habit: growth(id).habit,
  occurrences: occurrences([...done.map((offset) => ({ offset, done: true })), ...missed.map((offset) => ({ offset }))]),
});

describe('computeHighlights', () => {
  it('names the steadiest habit and the one that would welcome care', () => {
    const cards = computeHighlights(
      [growth('read', {}, { consistency: 0.93 }), growth('gym', { two_minute_version: null }, { consistency: 0.3 })],
      [],
      TODAY,
    );
    expect(cards).toEqual([
      expect.objectContaining({ kind: 'steady', habitId: 'read', percent: 93 }),
      expect.objectContaining({ kind: 'care', habitId: 'gym', percent: 30, hasMinimum: false }),
    ]);
  });

  it('spots the habit rising most: last 4 weeks against the 4 before', () => {
    // Before: 3 of 28 done (11 %); now: 21 of 28 done (75 %).
    const before = range(-55, -28);
    const now = range(-27, 0);
    const meditate = history('meditate', [...before.slice(0, 3), ...now.slice(0, 21)], [...before.slice(3), ...now.slice(21)]);
    const cards = computeHighlights([growth('meditate', {}, { consistency: 0.5, recentDue: 3 })], [meditate], TODAY);
    expect(cards).toContainEqual(expect.objectContaining({ kind: 'rising', habitId: 'meditate', from: 11, to: 75 }));
  });

  it('dates the next fruit from the recent pace', () => {
    // 52 of 66 so far, one a day lately → 14 days to go.
    const water = history('water', range(-27, 0));
    const cards = computeHighlights([growth('water', {}, { completions: 52, recentDue: 3 })], [water], TODAY);
    expect(cards).toContainEqual(
      expect.objectContaining({ kind: 'next_fruit', habitId: 'water', completions: 52, eta: '2026-10-14' }),
    );
  });

  it('shows each habit once and stays silent without enough data', () => {
    const lone = growth('read', {}, { consistency: 0.95 });
    expect(computeHighlights([lone], [], TODAY).map((c) => c.kind)).toEqual(['steady']);
    expect(computeHighlights([growth('new', {}, { consistency: 1, recentDue: 3 })], [], TODAY)).toEqual([]);
  });
});
