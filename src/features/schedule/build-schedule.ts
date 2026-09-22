import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import { activeAnchorId, stackDepth } from '@/features/habits/stacking';
import { formatLocalDate, getOccurrences, occurrenceKey } from '@/lib/recurrence';
import { getDayBand, type DayBand, type DayBandConfig } from '@/lib/time/day-bands';

export type ScheduleBand = DayBand | 'anytime';

export type ScheduledItem = {
  key: string;
  habit: Habit;
  /** The occurrence's identity (logs are matched on it). Never borrowed from an anchor. */
  at: Date;
  hasTime: boolean;
  /** Where to show it: a stacked habit borrows its anchor's slot on the same day. */
  displayAt: Date;
  displayHasTime: boolean;
  band: ScheduleBand;
  /** Set when the habit is stacked "after" another habit that occurs the same day. */
  anchorHabitId: string | null;
  /** 0 for a root habit, 1 for "after root", … Used to keep chains in order. */
  depth: number;
  log?: HabitLog;
};

/** Joins habits' occurrences in [from, to) with their logs, sorted for display. */
export function buildSchedule(
  habits: Habit[],
  logs: HabitLog[],
  from: Date,
  to: Date,
  bands: DayBandConfig,
): ScheduledItem[] {
  const logsByKey = new Map(
    logs.map((log) => [occurrenceKey(log.habit_id, new Date(log.occurrence_at)), log]),
  );

  const items: ScheduledItem[] = habits.flatMap((habit) =>
    getOccurrences(habit, from, to).map(({ at, hasTime }): ScheduledItem => {
      const key = occurrenceKey(habit.id, at);
      return {
        key,
        habit,
        at,
        hasTime,
        displayAt: at,
        displayHasTime: hasTime,
        band: hasTime ? getDayBand(at.getHours(), bands) : 'anytime',
        anchorHabitId: null,
        depth: stackDepth(habit, habits),
        log: logsByKey.get(key),
      };
    }),
  );

  // Resolve stacks from the root down, so a chain A → B → C inherits A's slot.
  const byHabitAndDay = new Map(items.map((item) => [`${item.habit.id}|${formatLocalDate(item.at)}`, item]));
  const ordered = [...items].sort((a, b) => a.depth - b.depth);
  for (const item of ordered) {
    const anchorId = activeAnchorId(item.habit, habits);
    if (!anchorId || item.hasTime) continue;
    const anchor = byHabitAndDay.get(`${anchorId}|${formatLocalDate(item.at)}`);
    if (!anchor) continue;
    item.anchorHabitId = anchorId;
    item.displayAt = anchor.displayAt;
    item.displayHasTime = anchor.displayHasTime;
    item.band = anchor.band;
  }

  return items.sort(
    (a, b) =>
      a.displayAt.getTime() - b.displayAt.getTime() ||
      Number(a.displayHasTime) - Number(b.displayHasTime) ||
      a.depth - b.depth,
  );
}

export function isDone(item: ScheduledItem): boolean {
  return item.log?.status === 'done' || item.log?.status === 'done_minimum';
}

/** The pending habit that follows `item` in its chain on the same day, if any. */
export function nextInChain(item: ScheduledItem, items: ScheduledItem[]): ScheduledItem | undefined {
  const day = formatLocalDate(item.at);
  return items.find(
    (other) => other.anchorHabitId === item.habit.id && formatLocalDate(other.at) === day && !isDone(other),
  );
}
