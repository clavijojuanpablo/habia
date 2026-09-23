import { daysBetween } from '@/lib/recurrence';

/**
 * Has this occurrence's day arrived? Day-granular on purpose: an evening habit
 * may be done early, but tomorrow has not happened yet, so it is neither
 * pending nor missed and must stay out of every count.
 */
export function hasCome(occurrenceAt: Date, now: Date): boolean {
  return daysBetween(now, occurrenceAt) <= 0;
}

/**
 * Can this occurrence be checked in right now?
 *
 * Today and the past are open (you may forget to log and catch up later, and an
 * evening habit can be done early). Tomorrow is not: a day that has not arrived
 * cannot be completed, and letting it through would make streaks and the tree
 * meaningless.
 */
export function canLog(occurrenceAt: Date, now: Date): boolean {
  return hasCome(occurrenceAt, now);
}

/** The earliest week the user can browse: the week they joined. */
export function isBeforeStart(date: Date, startedAt: Date): boolean {
  return daysBetween(startedAt, date) < 0;
}
