import { daysBetween, startOfDay } from '@/lib/recurrence';

/** "hace 5 min", "ayer", "hace 3 días": the i18n key under `time.ago` and its count. */
export type TimeAgo = { key: 'now' | 'minutes' | 'hours' | 'yesterday' | 'days' | 'weeks'; count: number };

/**
 * How long ago, the way people say it: minutes, then hours for anything under a day (even across
 * midnight), then calendar days ("ayer", "hace 3 días"), then weeks.
 */
export function timeAgo(then: Date, now: Date): TimeAgo {
  const minutes = Math.floor((now.getTime() - then.getTime()) / 60_000);
  if (minutes < 1) return { key: 'now', count: 0 };
  if (minutes < 60) return { key: 'minutes', count: minutes };
  if (minutes < 24 * 60) return { key: 'hours', count: Math.floor(minutes / 60) };
  const days = daysBetween(startOfDay(then), startOfDay(now));
  if (days <= 1) return { key: 'yesterday', count: 1 };
  if (days < 7) return { key: 'days', count: days };
  return { key: 'weeks', count: Math.floor(days / 7) };
}

/** Time left until a moment, rounded up so a wait never reads "0 min". */
export function timeUntil(target: Date, now: Date): { key: 'minutes' | 'hours'; count: number } {
  const minutes = Math.max(1, Math.ceil((target.getTime() - now.getTime()) / 60_000));
  return minutes < 60 ? { key: 'minutes', count: minutes } : { key: 'hours', count: Math.ceil(minutes / 60) };
}
