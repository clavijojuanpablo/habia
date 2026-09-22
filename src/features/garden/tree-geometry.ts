import { activeAnchorId } from '@/features/habits/stacking';

import type { GardenSummary, HabitGrowth } from './compute-garden';

export type Point = { x: number; y: number };

export type Leaf = Point & { angle: number; size: number; color: string; wilted: boolean };

export type Branch = {
  /** Identity id, or the habit id for a habit without identity. */
  key: string;
  color: string;
  start: Point;
  control: Point;
  end: Point;
  thickness: number;
  leaves: Leaf[];
  flowers: Point[];
  fruits: (Point & { color: string })[];
};

export type Root = { key: string; color: string; start: Point; control: Point; end: Point };

export type TreeGeometry = {
  ground: Point;
  /** Quadratic curve from the ground up. Null while the tree is still a seed. */
  trunk: { start: Point; control: Point; end: Point; width: number } | null;
  branches: Branch[];
  /** One root per habit stack ("after X, I do Y"), drawn underground. */
  roots: Root[];
};

export type BranchIdentity = { id: string; color: string | null };

const TRUNK_HEIGHT = [0.05, 0.16, 0.3, 0.4, 0.46];
const TRUNK_WIDTH = [2, 3, 9, 14, 19];
const MAX_BRANCHES = 10;
const LEAVES_PER_HABIT = 8;
const MAX_LEAVES = 16;
const MAX_FRUITS = 3;
const DEFAULT_COLOR = '#2F9E6B';

/** Deterministic PRNG so each branch keeps its shape between renders. */
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

type Group = { key: string; color: string; habits: HabitGrowth[] };

/** Identities first (in their order), then each habit without identity on its own branch. */
export function groupBranches(habits: HabitGrowth[], identities: BranchIdentity[]): Group[] {
  const groups: Group[] = identities
    .map((identity) => ({
      key: identity.id,
      color: identity.color ?? DEFAULT_COLOR,
      habits: habits.filter((g) => g.habit.identity_id === identity.id),
    }))
    .filter((g) => g.habits.length > 0);

  const known = new Set(identities.map((i) => i.id));
  for (const g of habits) {
    if (!g.habit.identity_id || !known.has(g.habit.identity_id)) {
      groups.push({ key: g.habit.id, color: g.habit.color ?? DEFAULT_COLOR, habits: [g] });
    }
  }
  return groups.slice(0, MAX_BRANCHES);
}

function buildBranch(
  group: Group,
  index: number,
  count: number,
  trunk: NonNullable<TreeGeometry['trunk']>,
  height: number,
  stage: number,
): Branch {
  const random = seededRandom(group.key);
  const side = index % 2 === 0 ? -1 : 1;
  const consistency = group.habits.reduce((sum, g) => sum + g.consistency, 0) / group.habits.length;

  // Higher branches sit higher on the trunk; spread them over its upper half.
  const t = 0.45 + 0.5 * (count === 1 ? 0.5 : index / (count - 1));
  const start = quadPoint(trunk.start, trunk.control, trunk.end, t);

  // Consistent groups grow longer branches; identities with more habits, thicker ones.
  const angle = ((35 + random() * 25) * Math.PI) / 180;
  const length = height * (0.12 + 0.14 * consistency) * (stage >= 3 ? 1 : 0.75);
  const end = { x: start.x + side * Math.sin(angle) * length, y: start.y - Math.cos(angle) * length };
  const control = {
    x: (start.x + end.x) / 2 - side * length * 0.1,
    y: (start.y + end.y) / 2 - length * (0.15 + random() * 0.1),
  };

  // Each habit contributes its own leaves (recent completions) in its own color.
  const sources = group.habits.flatMap((g) =>
    Array.from({ length: Math.min(LEAVES_PER_HABIT, g.recentCompletions) }, () => g),
  );
  // Interleave habits along the branch instead of clustering them.
  const perHabit = new Map<string, HabitGrowth[]>();
  for (const g of sources) {
    const queue = perHabit.get(g.habit.id);
    if (queue) queue.push(g);
    else perHabit.set(g.habit.id, [g]);
  }
  const interleaved: HabitGrowth[] = [];
  const queues = [...perHabit.values()];
  while (interleaved.length < Math.min(MAX_LEAVES, sources.length)) {
    for (const q of queues) {
      const next = q.shift();
      if (next && interleaved.length < MAX_LEAVES) interleaved.push(next);
    }
  }

  const branchAngle = Math.atan2(end.y - start.y, end.x - start.x);
  const leaves: Leaf[] = interleaved.map((g, k) => {
    const lt = 0.3 + (0.7 * (k + 1)) / (interleaved.length + 1);
    const p = quadPoint(start, control, end, lt);
    const flip = k % 2 === 0 ? 1 : -1;
    const droop = g.atRisk ? side * 0.7 : 0;
    return {
      x: p.x,
      y: p.y,
      angle: branchAngle + flip * (0.8 + random() * 0.4) + droop,
      size: 7 + random() * 4,
      color: g.habit.color ?? group.color,
      wilted: g.atRisk,
    };
  });

  const flowerCount = Math.min(4, group.habits.reduce((sum, g) => sum + g.flowers, 0));
  const flowers = Array.from({ length: flowerCount }, (_, k) => {
    const p = quadPoint(start, control, end, 0.45 + k * 0.15);
    return { x: p.x + (random() - 0.5) * 10, y: p.y - 6 - random() * 6 };
  });

  const fruits = group.habits
    .filter((g) => g.automaticity >= 1)
    .slice(0, MAX_FRUITS)
    .map((g, k) => {
      const p = quadPoint(start, control, end, 1 - k * 0.18);
      return { x: p.x, y: p.y + 8, color: g.habit.color ?? group.color };
    });

  return {
    key: group.key,
    color: group.color,
    start,
    control,
    end,
    thickness: Math.max(2, trunk.width * (0.3 + 0.08 * Math.min(group.habits.length, 4))),
    leaves,
    flowers,
    fruits,
  };
}

function buildRoots(summary: GardenSummary, ground: Point, width: number, height: number): Root[] {
  const all = summary.habits.map((g) => g.habit);
  const stacked = summary.habits.filter((g) => activeAnchorId(g.habit, all));
  return stacked.map((g, i) => {
    const random = seededRandom(`root-${g.habit.id}`);
    const side = i % 2 === 0 ? -1 : 1;
    const spread = width * (0.12 + 0.06 * (i >> 1)) + random() * width * 0.05;
    const depth = (height - ground.y) * (0.45 + random() * 0.35);
    const start = { x: ground.x + side * 3, y: ground.y + 2 };
    return {
      key: g.habit.id,
      color: g.habit.color ?? DEFAULT_COLOR,
      start,
      control: { x: ground.x + side * spread * 0.35, y: ground.y + depth * 0.9 },
      end: { x: ground.x + side * spread, y: ground.y + depth },
    };
  });
}

/** Lays out the Identity Tree for a canvas of the given size. */
export function buildTree(
  summary: GardenSummary,
  width: number,
  height: number,
  identities: BranchIdentity[] = [],
): TreeGeometry {
  const ground = { x: width / 2, y: height * 0.84 };
  if (summary.stage === 0) return { ground, trunk: null, branches: [], roots: [] };

  const trunkHeight = height * TRUNK_HEIGHT[summary.stage];
  const trunk = {
    start: ground,
    control: { x: ground.x + width * 0.02, y: ground.y - trunkHeight * 0.5 },
    end: { x: ground.x - width * 0.01, y: ground.y - trunkHeight },
    width: TRUNK_WIDTH[summary.stage],
  };
  const roots = buildRoots(summary, ground, width, height);

  // A sprout has no branches yet: its first habits show as leaves at the tip.
  if (summary.stage === 1) return { ground, trunk, branches: [], roots };

  const groups = groupBranches(summary.habits, identities);
  return {
    ground,
    trunk,
    branches: groups.map((g, i) => buildBranch(g, i, groups.length, trunk, height, summary.stage)),
    roots,
  };
}
