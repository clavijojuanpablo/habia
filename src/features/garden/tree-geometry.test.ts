import type { Habit } from '@/features/habits/api';

import type { GardenSummary, HabitGrowth } from './compute-garden';
import { buildTree, quadPoint, seededRandom } from './tree-geometry';

function growth(id: string, overrides: Partial<HabitGrowth> = {}): HabitGrowth {
  return {
    habit: { id, color: '#ff0000' } as Habit,
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

describe('buildTree', () => {
  it('is only a seed at stage 0', () => {
    const tree = buildTree(summary(0, [growth('a')]), 300, 300);
    expect(tree.trunk).toBeNull();
    expect(tree.branches).toHaveLength(0);
  });

  it('grows one branch per habit, alternating sides', () => {
    const tree = buildTree(summary(3, [growth('a'), growth('b')]), 300, 300);
    expect(tree.branches).toHaveLength(2);
    const [left, right] = tree.branches;
    expect(left.end.x).toBeLessThan(left.start.x);
    expect(right.end.x).toBeGreaterThan(right.start.x);
  });

  it('draws leaves from recent completions, fruit from automaticity', () => {
    const tree = buildTree(
      summary(4, [growth('a', { recentCompletions: 30, automaticity: 1 }), growth('b', { recentCompletions: 0 })]),
      300,
      300,
    );
    expect(tree.branches[0].leaves).toHaveLength(12);
    expect(tree.branches[0].fruit).not.toBeNull();
    expect(tree.branches[1].leaves).toHaveLength(0);
    expect(tree.branches[1].fruit).toBeNull();
  });

  it('keeps branch shapes stable between renders', () => {
    const a = buildTree(summary(3, [growth('a')]), 300, 300);
    const b = buildTree(summary(3, [growth('a')]), 300, 300);
    expect(a).toEqual(b);
  });
});
