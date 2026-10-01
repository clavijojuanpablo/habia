import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import type { Identity } from '@/features/identities/api';

import { computeBranches } from './compute-branches';

const WEEK = new Date(2026, 8, 28); // Monday
const identity = (id: string) => ({ id, statement: `I am ${id}` }) as Identity;
const habit = (id: string, identityId: string | null) => ({ id, name: id, identity_id: identityId }) as Habit;
const log = (habitId: string, day: number, status: HabitLog['status'] = 'done') =>
  ({ habit_id: habitId, occurrence_at: new Date(2026, 8, day).toISOString(), status }) as HabitLog;

describe('computeBranches', () => {
  it('counts this week’s seeds per identity and lists the habits that feed it', () => {
    const { branches } = computeBranches(
      [identity('reader'), identity('fit')],
      [habit('read', 'reader'), habit('write', 'reader'), habit('gym', 'fit')],
      [log('read', 28), log('write', 29, 'done_minimum'), log('read', 27), log('gym', 30, 'skipped')],
      WEEK,
    );
    expect(branches[0]).toMatchObject({ seedsThisWeek: 2 }); // the 27th is last week, skipped is not a seed
    expect(branches[0].habits.map((h) => h.id)).toEqual(['read', 'write']);
    expect(branches[1]).toMatchObject({ seedsThisWeek: 0 });
  });

  it('collects habits without a (known) identity as loose seeds', () => {
    const { loose } = computeBranches([identity('reader')], [habit('read', 'reader'), habit('water', null), habit('old', 'gone')], [], WEEK);
    expect(loose.map((h) => h.id)).toEqual(['water', 'old']);
  });
});
