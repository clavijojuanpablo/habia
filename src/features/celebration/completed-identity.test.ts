import type { ScheduledItem } from '@/features/schedule/build-schedule';

import { completedIdentity } from './completed-identity';

type Status = 'done' | 'skipped' | null;

function item(key: string, identity: string | null, status: Status = null, habitId = key): ScheduledItem {
  return {
    key,
    habit: { id: habitId, identity_id: identity },
    log: status ? { status } : undefined,
  } as unknown as ScheduledItem;
}

describe('completedIdentity', () => {
  it('fires on the last pending item of an identity', () => {
    const items = [item('a', 'strong', 'done'), item('b', 'strong'), item('c', 'calm')];
    expect(completedIdentity(items[1], items)).toBe('strong');
  });

  it('waits while another item of the identity is pending', () => {
    const items = [item('a', 'strong'), item('b', 'strong'), item('c', 'strong', 'done')];
    expect(completedIdentity(items[0], items)).toBeNull();
  });

  it('needs at least two items of the identity today', () => {
    const items = [item('a', 'strong'), item('b', 'calm', 'done')];
    expect(completedIdentity(items[0], items)).toBeNull();
  });

  it('counts habits, not the slots of one repeating habit', () => {
    const items = [item('a1', 'strong', 'done', 'water'), item('a2', 'strong', null, 'water')];
    expect(completedIdentity(items[1], items)).toBeNull();
  });

  it('leaves rests on purpose out of the branch', () => {
    const items = [item('a', 'strong', 'done'), item('b', 'strong', 'skipped'), item('c', 'strong')];
    expect(completedIdentity(items[2], items)).toBe('strong');
  });

  it('ignores habits without identity and un-checking', () => {
    const items = [item('a', null), item('b', 'strong', 'done'), item('c', 'strong', 'done')];
    expect(completedIdentity(items[0], items)).toBeNull();
    expect(completedIdentity(items[2], items)).toBeNull();
  });
});
