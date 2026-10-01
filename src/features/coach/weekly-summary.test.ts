import { addDays } from '@/lib/recurrence';

import { lastWeekStart, type SummaryHabit, type SummaryLog, summarizeWeek } from './weekly-summary';

// Monday 2026-09-21 → Sunday 2026-09-27 is the reviewed week.
const WEEK = new Date(2026, 8, 21);

const habit = (overrides: Partial<SummaryHabit> = {}): SummaryHabit => ({
  id: 'read',
  name: 'Leer',
  rrule: 'FREQ=DAILY',
  starts_on: '2026-09-01',
  window_start: null,
  window_end: null,
  two_minute_version: 'una página',
  implementation_intention: 'en mi cama',
  identity: 'Soy una persona que lee',
  ...overrides,
});

const log = (offset: number, status: SummaryLog['status'] = 'done', id = 'read'): SummaryLog => ({
  habit_id: id,
  occurrence_at: addDays(WEEK, offset),
  status,
});

describe('lastWeekStart', () => {
  it('is the Monday before the current week', () => {
    expect(lastWeekStart(new Date(2026, 8, 30))).toEqual(WEEK); // Wednesday the 30th
    expect(lastWeekStart(new Date(2026, 8, 28))).toEqual(WEEK); // Monday the 28th
  });
});

describe('summarizeWeek', () => {
  it('tallies done, minimum and missed days for the week', () => {
    const logs = [log(0), log(1, 'done_minimum'), log(2), log(4), log(5), log(6)];
    const summary = summarizeWeek([habit()], logs, WEEK);
    expect(summary.weekStart).toBe('2026-09-21');
    expect(summary.weekEnd).toBe('2026-09-27');
    expect(summary.habits[0]).toMatchObject({
      due: 7,
      done: 6,
      minimum: 1,
      percent: 86,
      missedWeekdays: [3], // Thursday
      hasMinimumVersion: true,
      where: 'en mi cama',
    });
    expect(summary.doneByWeekday).toEqual([1, 1, 1, 0, 1, 1, 1]);
  });

  it('treats a rest day as neither due nor missed', () => {
    const summary = summarizeWeek([habit()], [log(0, 'skipped'), ...[1, 2, 3, 4, 5, 6].map((d) => log(d))], WEEK);
    expect(summary.habits[0]).toMatchObject({ due: 6, done: 6, rest: 1, percent: 100, missedWeekdays: [] });
  });

  it('compares with the week before', () => {
    const previous = [-7, -6, -5].map((d) => log(d));
    const summary = summarizeWeek([habit()], [...previous, log(0)], WEEK);
    expect(summary.habits[0].previousPercent).toBe(43); // 3 of 7
    expect(summary.total).toMatchObject({ due: 7, done: 1, percent: 14, previousPercent: 43 });
  });

  it('leaves out habits with nothing due that week', () => {
    const tuesdays = habit({ id: 'gym', name: 'Gym', rrule: 'FREQ=WEEKLY;BYDAY=TU', starts_on: '2026-09-29' });
    const summary = summarizeWeek([habit(), tuesdays], [], WEEK);
    expect(summary.habits.map((h) => h.name)).toEqual(['Leer']);
  });
});
