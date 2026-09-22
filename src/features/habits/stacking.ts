/**
 * Habit stacking helpers ("After [current habit], I will [new habit]").
 * The database also rejects cycles; these helpers keep the UI from offering them.
 */

type Stackable = { id: string; anchor_habit_id: string | null; cue_type: string };

/** The anchor this habit effectively follows, or null when it is not stacked. */
export function activeAnchorId(habit: Stackable, habits: Stackable[]): string | null {
  if (habit.cue_type !== 'after_habit' || !habit.anchor_habit_id) return null;
  return habits.some((h) => h.id === habit.anchor_habit_id) ? habit.anchor_habit_id : null;
}

/** True if making `habitId` follow `anchorId` would close a loop. */
export function wouldCreateCycle(habits: Stackable[], habitId: string | undefined, anchorId: string): boolean {
  if (!habitId) return false;
  const byId = new Map(habits.map((h) => [h.id, h]));
  let current: string | null = anchorId;
  for (let depth = 0; current && depth < 50; depth++) {
    if (current === habitId) return true;
    const next = byId.get(current);
    current = next ? activeAnchorId(next, habits) : null;
  }
  return false;
}

/** Position in its chain: 0 for a root habit, 1 for "after root", and so on. */
export function stackDepth(habit: Stackable, habits: Stackable[]): number {
  const byId = new Map(habits.map((h) => [h.id, h]));
  let depth = 0;
  let current = activeAnchorId(habit, habits);
  while (current && depth < 50) {
    depth++;
    const next = byId.get(current);
    current = next ? activeAnchorId(next, habits) : null;
  }
  return depth;
}
