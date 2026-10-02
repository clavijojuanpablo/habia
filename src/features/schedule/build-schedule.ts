import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import { activeAnchorId, stackDepth } from '@/features/habits/stacking';
import { addDays, formatLocalDate, getOccurrences, occurrenceKey, startOfDay } from '@/lib/recurrence';
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

/** The start of the day an archived habit was archived, or null. */
const archivedDay = (habit: Habit) => (habit.archived_at ? startOfDay(new Date(habit.archived_at)) : null);

/** An archived habit's schedule runs through its archive day; that day only keeps what was logged. */
const endOf = (habit: Habit, to: Date) => {
  const day = archivedDay(habit);
  if (!day) return to;
  const end = addDays(day, 1);
  return end < to ? end : to;
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
    // Archived habits keep their past: their days before the archive date are still history.
    getOccurrences(habit, from, endOf(habit, to)).map(({ at, hasTime }): ScheduledItem => {
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

  // On its archive day, an archived habit only keeps a check-in already made: it asks for nothing more.
  const kept = items.filter((item) => {
    const day = archivedDay(item.habit);
    return !day || item.at < day || !!item.log;
  });

  // Resolve stacks from the root down, so a chain A → B → C inherits A's slot.
  const byHabitAndDay = new Map(kept.map((item) => [`${item.habit.id}|${formatLocalDate(item.at)}`, item]));
  const ordered = [...kept].sort((a, b) => a.depth - b.depth);
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

  return kept.sort(
    (a, b) =>
      a.displayAt.getTime() - b.displayAt.getTime() ||
      Number(a.displayHasTime) - Number(b.displayHasTime) ||
      a.depth - b.depth,
  );
}

export function isDone(item: ScheduledItem): boolean {
  return item.log?.status === 'done' || item.log?.status === 'done_minimum';
}

/** A day marked as a rest day on purpose: neither a vote nor a miss. */
export function isSkipped(item: ScheduledItem): boolean {
  return item.log?.status === 'skipped';
}

/** The pending habit that follows `item` in its chain on the same day, if any (a rest day is not pending). */
export function nextInChain(item: ScheduledItem, items: ScheduledItem[]): ScheduledItem | undefined {
  const day = formatLocalDate(item.at);
  return items.find(
    (other) =>
      other.anchorHabitId === item.habit.id && formatLocalDate(other.at) === day && !isDone(other) && !isSkipped(other),
  );
}
