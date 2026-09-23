import { daysBetween } from '@/lib/recurrence';

/**
 * Can this occurrence be checked in right now?
 *
 * Today and the past are open (you may forget to log and catch up later, and an
 * evening habit can be done early). Tomorrow is not: a day that has not arrived
 * cannot be completed, and letting it through would make streaks and the tree
 * meaningless.
 */
export function canLog(occurrenceAt: Date, now: Date): boolean {
  return daysBetween(now, occurrenceAt) <= 0;
}

/** The earliest week the user can browse: the week they joined. */
export function isBeforeStart(date: Date, startedAt: Date): boolean {
  return daysBetween(startedAt, date) < 0;
}
