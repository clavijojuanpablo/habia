import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import { addDays } from '@/lib/recurrence';

import { buildHistory } from './history';
import { TODAY } from './test-fixtures';

const habit = { id: 'h1', rrule: 'FREQ=DAILY', starts_on: '2026-09-25', window_start: null, window_end: null } as Habit;

const log = (offset: number, status: HabitLog['status'], loggedAt = addDays(TODAY, offset)): HabitLog =>
  ({
    habit_id: 'h1',
    occurrence_at: addDays(TODAY, offset).toISOString(),
    status,
    logged_at: loggedAt.toISOString(),
  }) as HabitLog;

describe('buildHistory', () => {
  it('lists past occurrences with their status and real check-in time', () => {
    const tapped = new Date(2026, 8, 28, 7, 10);
    const [{ occurrences }] = buildHistory(
      [habit],
      [log(-3, 'skipped'), log(-2, 'done', tapped), log(-1, 'done_minimum')],
      TODAY,
    );
    // 25th → 29th: five past days; today is pending, so it is not there yet.
    expect(occurrences).toHaveLength(5);
    expect(occurrences[2]).toMatchObject({ done: false, skipped: true });
    expect(occurrences[3]).toMatchObject({ done: true, minimum: false, loggedAt: tapped });
    expect(occurrences[4]).toMatchObject({ done: true, minimum: true });
    expect(occurrences[0]).toMatchObject({ done: false, loggedAt: null });
  });

  it('includes today once it is done', () => {
    const [{ occurrences }] = buildHistory([habit], [log(0, 'done')], TODAY);
    expect(occurrences).toHaveLength(6);
    expect(occurrences[5].done).toBe(true);
  });
});
