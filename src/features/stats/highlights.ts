import { AUTOMATICITY_REPETITIONS, type HabitGrowth } from '@/features/garden/compute-garden';
import type { HabitHistory, PastOccurrence } from '@/lib/history';
import { addDays, formatLocalDate } from '@/lib/recurrence';

/** One habit worth pointing out on Progress, with the numbers that earned it the spot. */
export type Highlight = { habitId: string; name: string; icon: string } & (
  | { kind: 'steady'; percent: number }
  | { kind: 'rising'; from: number; to: number }
  | { kind: 'next_fruit'; completions: number; eta: string }
  | { kind: 'care'; percent: number; hasMinimum: boolean }
);

/** Enough occurrences for a rate to mean something (no "100 %" from a single day). */
const MIN_SAMPLE = 7;
/** At or above this, a habit is steady; below it, it may want care. */
const STEADY = 0.6;
const RISE_POINTS = 15;
const PACE_DAYS = 28;
const MIN_COMPLETIONS_FOR_ETA = 10;
const MAX_ETA_DAYS = 120;

const percent = (ratio: number) => Math.round(ratio * 100);

/** Done / due of the counted (non-rest) occurrences in [from, to), or null below the sample. */
function rate(occurrences: PastOccurrence[], from: Date, to: Date): number | null {
  const counted = occurrences.filter((o) => !o.skipped && o.at >= from && o.at < to);
  return counted.length < MIN_SAMPLE ? null : counted.filter((o) => o.done).length / counted.length;
}

/**
 * The habits worth a word on Progress, in this order: the steadiest, the one rising most, the next
 * fruit (~66 repetitions, Lally et al.) and the one that would welcome care (the 2-minute rule).
 * Each habit appears once at most, and a card only exists when the data supports it.
 */
export function computeHighlights(growth: HabitGrowth[], history: HabitHistory[], today: Date): Highlight[] {
  const used = new Set<string>();
  const result: Highlight[] = [];
  const add = (g: HabitGrowth, card: Highlight) => {
    used.add(g.habit.id);
    result.push(card);
  };
  const base = (g: HabitGrowth) => ({ habitId: g.habit.id, name: g.habit.name, icon: g.habit.icon });
  const measured = growth.filter((g) => g.recentDue >= MIN_SAMPLE);

  const steady = [...measured].sort((a, b) => b.consistency - a.consistency)[0];
  if (steady && steady.consistency >= STEADY) add(steady, { ...base(steady), kind: 'steady', percent: percent(steady.consistency) });

  const tomorrow = addDays(today, 1);
  const recentFrom = addDays(tomorrow, -PACE_DAYS);
  const rising = growth
    .filter((g) => !used.has(g.habit.id))
    .flatMap((g) => {
      const occurrences = history.find((h) => h.habit.id === g.habit.id)?.occurrences ?? [];
      const now = rate(occurrences, recentFrom, tomorrow);
      const before = rate(occurrences, addDays(recentFrom, -PACE_DAYS), recentFrom);
      if (now === null || before === null) return [];
      const gain = percent(now) - percent(before);
      return gain >= RISE_POINTS ? [{ g, from: percent(before), to: percent(now), gain }] : [];
    })
    .sort((a, b) => b.gain - a.gain)[0];
  if (rising) add(rising.g, { ...base(rising.g), kind: 'rising', from: rising.from, to: rising.to });

  const nextFruit = growth
    .filter((g) => !used.has(g.habit.id))
    .filter((g) => g.completions >= MIN_COMPLETIONS_FOR_ETA && g.completions < AUTOMATICITY_REPETITIONS)
    .flatMap((g) => {
      const occurrences = history.find((h) => h.habit.id === g.habit.id)?.occurrences ?? [];
      const pace = occurrences.filter((o) => o.done && o.at >= recentFrom).length / PACE_DAYS;
      if (pace === 0) return [];
      const daysLeft = Math.ceil((AUTOMATICITY_REPETITIONS - g.completions) / pace);
      return daysLeft <= MAX_ETA_DAYS ? [{ g, daysLeft }] : [];
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)[0];
  if (nextFruit)
    add(nextFruit.g, {
      ...base(nextFruit.g),
      kind: 'next_fruit',
      completions: nextFruit.g.completions,
      eta: formatLocalDate(addDays(today, nextFruit.daysLeft)),
    });

  const care = measured.filter((g) => !used.has(g.habit.id)).sort((a, b) => a.consistency - b.consistency)[0];
  if (care && care.consistency < STEADY)
    add(care, {
      ...base(care),
      kind: 'care',
      percent: percent(care.consistency),
      hasMinimum: !!care.habit.two_minute_version,
    });

  return result;
}
