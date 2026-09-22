import type { HabitLog } from '@/features/checkins/api';
import type { Habit } from '@/features/habits/api';
import { addDays, getOccurrences, occurrenceKey, startOfDay } from '@/lib/recurrence';

/** Lally et al. (2010): median time to automaticity. */
export const AUTOMATICITY_REPETITIONS = 66;
/** How far back the garden looks at logs. */
export const GARDEN_WINDOW_DAYS = 120;

export type HabitGrowth = {
  habit: Habit;
  /** Completions in the window. */
  completions: number;
  /** Completions in the last 14 days → leaves on the branch. */
  recentCompletions: number;
  /** Streak that survives a single miss ("never miss twice"). */
  streak: number;
  /** The most recent due occurrence was missed: one more miss breaks the streak. */
  atRisk: boolean;
  /** Done / due over the last 30 days, 0–1. */
  consistency: number;
  /** Progress toward ~66 repetitions, 0–1. */
  automaticity: number;
  /** Last 4 full weeks with ≥ 80% consistency → flowers. */
  flowers: number;
};

export type GardenStage = 0 | 1 | 2 | 3 | 4;

export type GardenSummary = {
  habits: HabitGrowth[];
  votes: number;
  stage: GardenStage;
  /** 30–100: leaves droop with recent misses, but the tree never dies. */
  health: number;
  fruits: number;
};

type Due = { at: Date; done: boolean };

const isDoneLog = (log?: HabitLog) => log?.status === 'done' || log?.status === 'done_minimum';

/**
 * Occurrences that already "count": every occurrence of past days, plus today's
 * occurrences only when done (a pending habit today is not a miss yet).
 */
function dueOccurrences(habit: Habit, logsByKey: Map<string, HabitLog>, today: Date): Due[] {
  const from = addDays(today, -GARDEN_WINDOW_DAYS);
  return getOccurrences(habit, from, addDays(today, 1))
    .map(({ at }) => ({ at, done: isDoneLog(logsByKey.get(occurrenceKey(habit.id, at))) }))
    .filter(({ at, done }) => at < today || done);
}

function ratio(items: Due[]) {
  return items.length === 0 ? 0 : items.filter((d) => d.done).length / items.length;
}

export function computeHabitGrowth(habit: Habit, logsByKey: Map<string, HabitLog>, today: Date): HabitGrowth {
  const due = dueOccurrences(habit, logsByKey, today);

  // Walk backwards: a single miss is forgiven, two consecutive misses end the streak.
  let streak = 0;
  let consecutiveMisses = 0;
  for (let i = due.length - 1; i >= 0; i--) {
    if (due[i].done) {
      streak++;
      consecutiveMisses = 0;
    } else if (++consecutiveMisses >= 2) {
      break;
    }
  }
  const last = due[due.length - 1];

  const completions = due.filter((d) => d.done).length;
  const since = (days: number) => due.filter((d) => d.at >= addDays(today, -days));

  let flowers = 0;
  for (let week = 0; week < 4; week++) {
    const end = addDays(today, -7 * week);
    const weekDue = due.filter((d) => d.at >= addDays(end, -7) && d.at < end);
    if (weekDue.length > 0 && ratio(weekDue) >= 0.8) flowers++;
  }

  return {
    habit,
    completions,
    recentCompletions: since(14).filter((d) => d.done).length,
    streak,
    atRisk: !!last && !last.done,
    consistency: ratio(since(30)),
    automaticity: Math.min(1, completions / AUTOMATICITY_REPETITIONS),
    flowers,
  };
}

export function stageFor(votes: number, fruits: number): GardenStage {
  if (votes >= 200 || (fruits > 0 && votes >= 75)) return 4;
  if (votes >= 75) return 3;
  if (votes >= 25) return 2;
  if (votes >= 5) return 1;
  return 0;
}

export function computeGarden(habits: Habit[], logs: HabitLog[], votes: number, now: Date): GardenSummary {
  const today = startOfDay(now);
  const logsByKey = new Map(logs.map((log) => [occurrenceKey(log.habit_id, new Date(log.occurrence_at)), log]));
  const growth = habits.map((habit) => computeHabitGrowth(habit, logsByKey, today));
  const fruits = growth.filter((g) => g.automaticity >= 1).length;
  const wilted = growth.filter((g) => g.atRisk).length;

  return {
    habits: growth,
    votes,
    stage: stageFor(votes, fruits),
    health: Math.max(30, 100 - wilted * 15),
    fruits,
  };
}
