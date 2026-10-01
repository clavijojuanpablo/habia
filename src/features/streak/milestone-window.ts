const SIZE = 4;

/**
 * The milestones worth showing on a horizontal timeline: the last one reached (if any), the one
 * being worked toward, and the next ones, four in total and clamped at both ends.
 * `target` is the index in `milestones` of the next goal, or -1 once all are reached.
 */
export function milestoneWindow(current: number, milestones: readonly number[]) {
  const target = milestones.findIndex((m) => m > current);
  const anchor = target === -1 ? milestones.length - 1 : target;
  const end = Math.min(milestones.length, Math.max(0, anchor - 1) + SIZE);
  const start = Math.max(0, end - SIZE);
  return { shown: milestones.slice(start, end), target: target === -1 ? -1 : target - start };
}
