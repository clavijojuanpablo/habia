import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import type { ScheduledItem } from '@/features/schedule/build-schedule';

import { planReminders } from './plan-reminders';

const NOW = new Date(2026, 8, 21, 10, 0);

function item(overrides: {
  at: Date;
  hasTime?: boolean;
  minutes?: number | null;
  log?: Partial<HabitLog>;
}): ScheduledItem {
  const habit = { id: 'h1', name: 'Read', reminder_minutes_before: overrides.minutes ?? 0 } as Habit;
  if (overrides.minutes === null) habit.reminder_minutes_before = null;
  return {
    key: overrides.at.toISOString(),
    habit,
    at: overrides.at,
    hasTime: overrides.hasTime ?? true,
    displayAt: overrides.at,
    displayHasTime: overrides.hasTime ?? true,
    band: 'morning',
    anchorHabitId: null,
    depth: 0,
    log: overrides.log as HabitLog | undefined,
  };
}

describe('planReminders', () => {
  it('schedules future timed occurrences, applying the offset', () => {
    const [planned] = planReminders([item({ at: new Date(2026, 8, 21, 12, 0), minutes: 15 })], NOW);
    expect(planned.fireAt).toEqual(new Date(2026, 8, 21, 11, 45));
  });

  it('skips past, all-day, disabled and done occurrences', () => {
    const planned = planReminders(
      [
        item({ at: new Date(2026, 8, 21, 9, 0) }),
        item({ at: new Date(2026, 8, 21, 0, 0), hasTime: false }),
        item({ at: new Date(2026, 8, 21, 12, 0), minutes: null }),
        item({ at: new Date(2026, 8, 21, 13, 0), log: { status: 'done' } }),
      ],
      NOW,
    );
    expect(planned).toEqual([]);
  });

  it('skips an occurrence whose reminder time already passed', () => {
    expect(planReminders([item({ at: new Date(2026, 8, 21, 10, 10), minutes: 30 })], NOW)).toEqual([]);
  });

  it('keeps the soonest reminders up to the limit', () => {
    const items = [14, 11, 12].map((h) => item({ at: new Date(2026, 8, 21, h, 0) }));
    const planned = planReminders(items, NOW, 2);
    expect(planned.map((p) => p.fireAt.getHours())).toEqual([11, 12]);
  });
});
