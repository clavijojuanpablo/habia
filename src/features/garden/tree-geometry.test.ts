import type { Habit } from '@/features/habits/api';

import type { GardenSummary, HabitGrowth } from './compute-garden';
import { buildTree, groupBranches, quadPoint, seededRandom } from './tree-geometry';

function growth(id: string, habit: Partial<Habit> = {}, overrides: Partial<HabitGrowth> = {}): HabitGrowth {
  return {
    habit: { id, color: '#ff0000', identity_id: null, anchor_habit_id: null, cue_type: 'time', ...habit } as Habit,
    completions: 10,
    recentCompletions: 5,
    streak: 3,
    atRisk: false,
    consistency: 0.8,
    automaticity: 0.2,
    flowers: 1,
    ...overrides,
  };
}

function summary(stage: GardenSummary['stage'], habits: HabitGrowth[]): GardenSummary {
  return { stage, habits, votes: 100, health: 100, fruits: 0 };
}

describe('seededRandom', () => {
  it('is deterministic per seed', () => {
    const a = seededRandom('habit-1');
    const b = seededRandom('habit-1');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
    expect(seededRandom('habit-2')()).not.toBe(seededRandom('habit-1')());
  });
});

describe('quadPoint', () => {
  it('returns the endpoints at t=0 and t=1', () => {
    const p0 = { x: 0, y: 0 };
    const p1 = { x: 10, y: 10 };
    expect(quadPoint(p0, { x: 5, y: 0 }, p1, 0)).toEqual(p0);
    expect(quadPoint(p0, { x: 5, y: 0 }, p1, 1)).toEqual(p1);
  });
});

describe('groupBranches', () => {
  it('puts habits of the same identity on one branch, others on their own', () => {
    const groups = groupBranches(
      [growth('run', { identity_id: 'health' }), growth('gym', { identity_id: 'health' }), growth('read')],
      [{ id: 'health', color: '#00f' }],
    );
    expect(groups.map((g) => [g.key, g.habits.length])).toEqual([
      ['health', 2],
      ['read', 1],
    ]);
  });

  it('skips identities with no habits', () => {
    expect(groupBranches([growth('read')], [{ id: 'empty', color: null }]).map((g) => g.key)).toEqual(['read']);
  });
});

describe('buildTree', () => {
  it('is only a seed at stage 0', () => {
    const tree = buildTree(summary(0, [growth('a')]), 300, 300);
    expect(tree.trunk).toBeNull();
    expect(tree.branches).toHaveLength(0);
  });

  it('grows one branch per group, alternating sides', () => {
    const tree = buildTree(summary(3, [growth('a'), growth('b')]), 300, 300);
    const [left, right] = tree.branches;
    expect(left.end.x).toBeLessThan(left.start.x);
    expect(right.end.x).toBeGreaterThan(right.start.x);
  });

  it('colors leaves by habit and gives fruit for automatic habits', () => {
    const tree = buildTree(
      summary(4, [
        growth('run', { identity_id: 'health', color: '#111111' }, { recentCompletions: 3, automaticity: 1 }),
        growth('gym', { identity_id: 'health', color: '#222222' }, { recentCompletions: 3 }),
      ]),
      300,
      300,
      [{ id: 'health', color: '#00f' }],
    );
    const [branch] = tree.branches;
    expect(branch.leaves).toHaveLength(6);
    expect(new Set(branch.leaves.map((l) => l.color))).toEqual(new Set(['#111111', '#222222']));
    expect(branch.leaves[0].color).not.toBe(branch.leaves[1].color); // interleaved
    expect(branch.fruits).toHaveLength(1);
  });

  it('caps leaves per branch', () => {
    const tree = buildTree(summary(3, [growth('a', {}, { recentCompletions: 30 })]), 300, 300);
    expect(tree.branches[0].leaves).toHaveLength(8);
  });

  it('draws one root per active habit stack', () => {
    const tree = buildTree(
      summary(2, [growth('coffee'), growth('study', { cue_type: 'after_habit', anchor_habit_id: 'coffee' })]),
      300,
      300,
    );
    expect(tree.roots.map((r) => r.key)).toEqual(['study']);
    expect(tree.roots[0].end.y).toBeGreaterThan(tree.ground.y);
  });

  it('keeps shapes stable between renders', () => {
    expect(buildTree(summary(3, [growth('a')]), 300, 300)).toEqual(buildTree(summary(3, [growth('a')]), 300, 300));
  });
});
