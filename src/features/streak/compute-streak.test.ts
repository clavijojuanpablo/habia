import type { DayStat } from '@/features/stats/compute-stats';
import { addDays } from '@/lib/recurrence';

import { computeStreak } from './compute-streak';

// Today is Wednesday 2026-09-23.
const TODAY = new Date(2026, 8, 23);

/** Build days ending today from a pattern, oldest first: D=done, M=missed, R=rest, P=today pending. */
function days(pattern: string): DayStat[] {
  const chars = pattern.split('');
  return chars.map((c, i) => {
    const date = addDays(TODAY, i - (chars.length - 1));
    const due = c === 'R' ? 0 : 1;
    const done = c === 'D' ? 1 : 0;
    return { date, due, done, ratio: due === 0 ? null : done / due };
  });
}

describe('computeStreak', () => {
  it('counts consecutive active days including today', () => {
    expect(computeStreak(days('MMDDD'), TODAY).current).toBe(3);
  });

  it('does not break while today is still pending', () => {
    const streak = computeStreak(days('DDDP'), TODAY);
    expect(streak.current).toBe(3);
    expect(streak.todayDone).toBe(false);
  });

  it('forgives a single missed day ("never miss twice")', () => {
    const streak = computeStreak(days('DDMDD'), TODAY);
    expect(streak.current).toBe(4);
  });

  it('resets after two missed days in a row', () => {
    expect(computeStreak(days('DDDMMDD'), TODAY).current).toBe(2);
  });

  it('treats rest days as neutral', () => {
    expect(computeStreak(days('DRRDD'), TODAY).current).toBe(3);
  });

  it('keeps the streak alive when yesterday was the only miss', () => {
    const streak = computeStreak(days('DDDMP'), TODAY);
    expect(streak.current).toBe(3);
    expect(streak.week.find((d) => d.date.getTime() === addDays(TODAY, -1).getTime())?.state).toBe('forgiven');
  });

  it('remembers the record even after a reset', () => {
    const streak = computeStreak(days('DDDDDMMDD'), TODAY);
    expect(streak.current).toBe(2);
    expect(streak.record).toBe(5);
  });

  it('describes the current week Monday → Sunday', () => {
    // Mon, Tue done; Wed (today) pending; Thu–Sun future.
    const streak = computeStreak(days('DDP'), TODAY);
    expect(streak.week.map((d) => d.state)).toEqual(['done', 'done', 'pending', 'future', 'future', 'future', 'future']);
  });

  it('points to the next milestone', () => {
    const streak = computeStreak(days('DDDDD'), TODAY);
    expect(streak.previousMilestone).toBe(3);
    expect(streak.nextMilestone).toBe(7);
  });
});
