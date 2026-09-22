import type { GardenSummary, HabitGrowth } from './compute-garden';

export type Point = { x: number; y: number };

export type Leaf = Point & { angle: number; size: number };

export type Branch = {
  habitId: string;
  color: string;
  start: Point;
  control: Point;
  end: Point;
  thickness: number;
  leaves: Leaf[];
  flowers: Point[];
  fruit: Point | null;
  wilted: boolean;
};

export type TreeGeometry = {
  ground: Point;
  /** Quadratic curve from the ground up. Null while the tree is still a seed. */
  trunk: { start: Point; control: Point; end: Point; width: number } | null;
  branches: Branch[];
};

const TRUNK_HEIGHT = [0.05, 0.16, 0.3, 0.4, 0.46];
const TRUNK_WIDTH = [2, 3, 9, 14, 19];
const MAX_BRANCHES = 10;
const MAX_LEAVES = 12;
const DEFAULT_COLOR = '#2F9E6B';

/** Deterministic PRNG so each habit's branch keeps its shape between renders. */
export function seededRandom(seed: string) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function quadPoint(p0: Point, c: Point, p1: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * c.x + t * t * p1.x,
    y: u * u * p0.y + 2 * u * t * c.y + t * t * p1.y,
  };
}

function buildBranch(
  growth: HabitGrowth,
  index: number,
  count: number,
  trunk: NonNullable<TreeGeometry['trunk']>,
  height: number,
  stage: number,
): Branch {
  const random = seededRandom(growth.habit.id);
  const side = index % 2 === 0 ? -1 : 1;

  // Higher habits sit higher on the trunk; spread them over its upper half.
  const t = 0.45 + 0.5 * (count === 1 ? 0.5 : index / (count - 1));
  const start = quadPoint(trunk.start, trunk.control, trunk.end, t);

  // Consistent habits grow longer branches.
  const angle = ((35 + random() * 25) * Math.PI) / 180;
  const length = height * (0.12 + 0.14 * growth.consistency) * (stage >= 3 ? 1 : 0.75);
  const end = { x: start.x + side * Math.sin(angle) * length, y: start.y - Math.cos(angle) * length };
  const control = {
    x: (start.x + end.x) / 2 - side * length * 0.1,
    y: (start.y + end.y) / 2 - length * (0.15 + random() * 0.1),
  };

  // Leaves: recent completions. Drooping and pale when the habit is at risk.
  const leafCount = Math.min(MAX_LEAVES, growth.recentCompletions);
  const branchAngle = Math.atan2(end.y - start.y, end.x - start.x);
  const leaves: Leaf[] = Array.from({ length: leafCount }, (_, k) => {
    const lt = 0.3 + (0.7 * (k + 1)) / (leafCount + 1);
    const p = quadPoint(start, control, end, lt);
    const flip = k % 2 === 0 ? 1 : -1;
    const droop = growth.atRisk ? side * 0.7 : 0;
    return {
      x: p.x,
      y: p.y,
      angle: branchAngle + flip * (0.8 + random() * 0.4) + droop,
      size: 7 + random() * 4,
    };
  });

  const flowers = Array.from({ length: growth.flowers }, (_, k) => {
    const p = quadPoint(start, control, end, 0.45 + k * 0.15);
    return { x: p.x + (random() - 0.5) * 10, y: p.y - 6 - random() * 6 };
  });

  return {
    habitId: growth.habit.id,
    color: growth.habit.color ?? DEFAULT_COLOR,
    start,
    control,
    end,
    thickness: Math.max(2, trunk.width * 0.35),
    leaves,
    flowers,
    fruit: growth.automaticity >= 1 ? { x: end.x, y: end.y + 8 } : null,
    wilted: growth.atRisk,
  };
}

/** Lays out the Identity Tree for a canvas of the given size. */
export function buildTree(summary: GardenSummary, width: number, height: number): TreeGeometry {
  const ground = { x: width / 2, y: height * 0.84 };
  if (summary.stage === 0) return { ground, trunk: null, branches: [] };

  const trunkHeight = height * TRUNK_HEIGHT[summary.stage];
  const trunk = {
    start: ground,
    control: { x: ground.x + width * 0.02, y: ground.y - trunkHeight * 0.5 },
    end: { x: ground.x - width * 0.01, y: ground.y - trunkHeight },
    width: TRUNK_WIDTH[summary.stage],
  };

  // A sprout has no branches yet: its first habits show as leaves at the tip.
  if (summary.stage === 1) {
    return { ground, trunk, branches: [] };
  }

  const growing = summary.habits.slice(0, MAX_BRANCHES);
  return {
    ground,
    trunk,
    branches: growing.map((g, i) => buildBranch(g, i, growing.length, trunk, height, summary.stage)),
  };
}
