import { daysBetween, parseLocalDate } from '@/lib/recurrence';

import { DETECTORS } from './detectors';
import type { CoachInput, CoachRule, CoachTip, ShownTip } from './types';

/** Phrasings per rule in i18n (`v0`, `v1`): the same insight never reads the same two days running. */
export const VARIANTS = 2;
/** An insight shown in the last few days loses this much, so the coach does not nag. */
export const NOVELTY_PENALTY = 100;
const NOVELTY_DAYS = 3;
/** Urgent and time-bound: a new miss deserves a word even if one was shown recently. */
const NOVELTY_EXEMPT: CoachRule[] = ['never_miss_twice', 'comeback'];

/** Small, stable string hash (djb2): the same input always picks the same option. */
function hash(text: string): number {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) >>> 0;
  return h;
}

/**
 * The coach's brain: every detector proposes candidates from the user's own data,
 * recently shown insights are penalized, and the highest score wins.
 * Returns null without habits.
 */
export function computeTip(input: CoachInput, memory: ShownTip[] = []): CoachTip | null {
  if (input.growth.length === 0) return null;

  const recent = new Set(
    memory
      .filter((m) => {
        const age = daysBetween(parseLocalDate(m.date), input.today);
        return age >= 0 && age < NOVELTY_DAYS;
      })
      .map((m) => m.key),
  );
  const day = daysBetween(new Date(2000, 0, 1), input.today);

  const ranked = DETECTORS.flatMap((detect) => detect(input))
    .map((c) => ({
      ...c,
      final: c.score - (recent.has(c.key) && !NOVELTY_EXEMPT.includes(c.body.rule) ? NOVELTY_PENALTY : 0),
    }))
    // Ties go to a stable, date-dependent pick instead of always the same candidate.
    .sort((a, b) => b.final - a.final || hash(`${day}:${a.key}`) - hash(`${day}:${b.key}`));

  const best = ranked[0];
  if (!best) return null;
  // Alternates day by day for a given insight, starting at a different phrasing per insight.
  const variant = (day + hash(best.key)) % VARIANTS;
  return { ...best.body, key: best.key, variant };
}
