/**
 * Recurrence engine.
 *
 * Habits store their frequency as an RFC 5545 RRULE string. We support the subset
 * the app can express, and expand it ourselves using local-time Date arithmetic so
 * occurrences stay at the same wall-clock time across DST changes.
 *
 * Supported rules:
 *   FREQ=DAILY                      every day
 *   FREQ=DAILY;INTERVAL=n           every n days, anchored at `starts_on`
 *   FREQ=WEEKLY;BYDAY=TU,TH         on specific weekdays
 *   FREQ=HOURLY;INTERVAL=n          every n hours inside [window_start, window_end]
 */

export type Weekday = 'MO' | 'TU' | 'WE' | 'TH' | 'FR' | 'SA' | 'SU';

/** Monday-first, matching the week view. */
export const WEEKDAYS: Weekday[] = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export type Frequency =
  | { kind: 'daily' }
  | { kind: 'interval_days'; interval: number }
  | { kind: 'weekdays'; days: Weekday[] }
  | { kind: 'interval_hours'; interval: number };

export type Schedulable = {
  rrule: string;
  /** Local date, `YYYY-MM-DD`. */
  starts_on: string;
  /** Local time, `HH:MM` or `HH:MM:SS`. */
  window_start: string | null;
  window_end: string | null;
};

export type Occurrence = {
  /** Local date-time of the occurrence. Midnight when `hasTime` is false. */
  at: Date;
  /** False for "any time that day" habits. */
  hasTime: boolean;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function toRRule(frequency: Frequency): string {
  switch (frequency.kind) {
    case 'daily':
      return 'FREQ=DAILY';
    case 'interval_days':
      return frequency.interval <= 1 ? 'FREQ=DAILY' : `FREQ=DAILY;INTERVAL=${frequency.interval}`;
    case 'weekdays': {
      const days = WEEKDAYS.filter((d) => frequency.days.includes(d));
      return `FREQ=WEEKLY;BYDAY=${days.join(',')}`;
    }
    case 'interval_hours':
      return `FREQ=HOURLY;INTERVAL=${Math.max(1, frequency.interval)}`;
  }
}

export function parseRRule(rrule: string): Frequency {
  const parts = Object.fromEntries(
    rrule
      .replace(/^RRULE:/, '')
      .split(';')
      .filter(Boolean)
      .map((p) => p.split('=') as [string, string]),
  );
  const interval = parts.INTERVAL ? parseInt(parts.INTERVAL, 10) : 1;

  switch (parts.FREQ) {
    case 'DAILY':
      return interval > 1 ? { kind: 'interval_days', interval } : { kind: 'daily' };
    case 'WEEKLY': {
      const days = (parts.BYDAY ?? '')
        .split(',')
        .filter((d: string): d is Weekday => WEEKDAYS.includes(d as Weekday));
      return days.length > 0 ? { kind: 'weekdays', days } : { kind: 'daily' };
    }
    case 'HOURLY':
      return { kind: 'interval_hours', interval: Math.max(1, interval) };
    default:
      return { kind: 'daily' };
  }
}

/** `YYYY-MM-DD` → local midnight. */
export function parseLocalDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Date → `YYYY-MM-DD` in local time. */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** `HH:MM[:SS]` → minutes since midnight. */
export function parseTimeToMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number);
  return h * 60 + (m || 0);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Whole calendar days between two dates (DST-safe). */
export function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);
}

/** Monday = 0 … Sunday = 6. */
export function weekdayIndex(date: Date): number {
  return (date.getDay() + 6) % 7;
}

export function startOfWeek(date: Date): Date {
  return addDays(startOfDay(date), -weekdayIndex(date));
}

function atMinutes(day: Date, minutes: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, minutes);
}

function occursOnDay(frequency: Frequency, day: Date, startsOn: Date): boolean {
  switch (frequency.kind) {
    case 'daily':
    case 'interval_hours':
      return true;
    case 'interval_days':
      return daysBetween(startsOn, day) % frequency.interval === 0;
    case 'weekdays':
      return frequency.days.includes(WEEKDAYS[weekdayIndex(day)]);
  }
}

/**
 * Expands a habit's schedule into occurrences for every calendar day in
 * [startOfDay(from), to). The range is day-granular: all occurrences of a day
 * are returned when that day is inside the range.
 */
export function getOccurrences(habit: Schedulable, from: Date, to: Date): Occurrence[] {
  const frequency = parseRRule(habit.rrule);
  const startsOn = parseLocalDate(habit.starts_on);
  const windowStart = habit.window_start ? parseTimeToMinutes(habit.window_start) : null;
  const windowEnd = habit.window_end ? parseTimeToMinutes(habit.window_end) : null;
  const result: Occurrence[] = [];

  for (let day = startOfDay(from); day < to; day = addDays(day, 1)) {
    if (day < startsOn || !occursOnDay(frequency, day, startsOn)) continue;

    if (frequency.kind === 'interval_hours') {
      const first = windowStart ?? 0;
      const last = windowEnd ?? 24 * 60 - 1;
      for (let m = first; m <= last; m += frequency.interval * 60) {
        result.push({ at: atMinutes(day, m), hasTime: true });
      }
    } else if (windowStart !== null) {
      result.push({ at: atMinutes(day, windowStart), hasTime: true });
    } else {
      result.push({ at: day, hasTime: false });
    }
  }

  return result;
}

/** Stable key for matching an occurrence with its log row. */
export function occurrenceKey(habitId: string, at: Date): string {
  return `${habitId}@${at.toISOString()}`;
}
