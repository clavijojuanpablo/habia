import { addDays, formatLocalDate, getOccurrences, occurrenceKey, parseLocalDate } from '@/lib/recurrence';

/**
 * Patterns between habits, computed in code so Brote only explains them (never guesses):
 * "the days you meditate you also read" (same day) and "after a day without sleep, the gym
 * slips" (next day). Pure: runs in the app's tests and, synced into
 * `supabase/functions/_shared/`, inside the `coach-chat` Edge Function. Local (floating) dates.
 */

export type PatternHabit = {
  id: string;
  rrule: string;
  starts_on: string;
  window_start: string | null;
  window_end: string | null;
};

export type PatternLog = {
  habit_id: string;
  /** Local (floating) time of the occurrence the log answers. */
  occurrence_at: Date;
  status: 'done' | 'done_minimum' | 'skipped' | 'missed';
};

/** A habit's day: done (any occurrence done), rest (only rests), or missed. */
export type DayStatus = 'done' | 'missed' | 'rest';

/** Per habit, its settled days in [from, to): `YYYY-MM-DD` → status. */
export function habitDays(
  habits: PatternHabit[],
  logs: PatternLog[],
  from: Date,
  to: Date,
): Map<string, Map<string, DayStatus>> {
  const logByKey = new Map(logs.map((log) => [occurrenceKey(log.habit_id, log.occurrence_at), log.status]));
  const result = new Map<string, Map<string, DayStatus>>();
  for (const habit of habits) {
    const days = new Map<string, DayStatus>();
    for (const { at } of getOccurrences(habit, from, to)) {
      const date = formatLocalDate(at);
      const status = logByKey.get(occurrenceKey(habit.id, at));
      const day: DayStatus = status === 'done' || status === 'done_minimum' ? 'done' : status === 'skipped' ? 'rest' : 'missed';
      const before = days.get(date);
      // Done wins the day; a miss beats a rest; a rest stays only if it is all there is.
      if (!before || day === 'done' || (day === 'missed' && before === 'rest')) days.set(date, day);
    }
    result.set(habit.id, days);
  }
  return result;
}

export type Pattern = {
  /**
   * `same_day`: both on the same day. `next_day`: `from` on one day, `to` the day after — only
   * where `to` was also due (and done) the day before, so a habit on Tue/Thu never gets one.
   */
  kind: 'same_day' | 'next_day';
  from: string;
  to: string;
  /** How often `to` was done when `from` was done / when it was not, 0–100. */
  withPercent: number;
  withoutPercent: number;
  /** Days behind the two percentages. */
  days: number;
};

type Options = {
  /** Days needed on EACH side (with and without), so one lucky week proves nothing. */
  minEach?: number;
  /** Percentage points between the two sides to call it a pattern. */
  minGap?: number;
  max?: number;
};

const pct = (done: number, total: number) => Math.round((done / total) * 100);

/** The strongest patterns between habits, most telling first. Rests never count either way. */
export function findPatterns(
  days: Map<string, Map<string, DayStatus>>,
  { minEach = 5, minGap = 30, max = 3 }: Options = {},
): Pattern[] {
  const found: (Pattern & { gap: number })[] = [];
  const ids = [...days.keys()];
  for (const from of ids) {
    for (const to of ids) {
      if (from === to) continue;
      for (const kind of ['same_day', 'next_day'] as const) {
        const withSide = { done: 0, total: 0 };
        const withoutSide = { done: 0, total: 0 };
        for (const [date, toStatus] of days.get(to)!) {
          if (toStatus === 'rest') continue;
          const yesterday = formatLocalDate(addDays(parseLocalDate(date), -1));
          // Next day: only days after `to` was done, so a good or bad streak (everything up or
          // everything down together) never passes for one habit pulling the other.
          if (kind === 'next_day' && days.get(to)!.get(yesterday) !== 'done') continue;
          const fromStatus = days.get(from)!.get(kind === 'same_day' ? date : yesterday);
          if (!fromStatus || fromStatus === 'rest') continue;
          const side = fromStatus === 'done' ? withSide : withoutSide;
          side.total += 1;
          if (toStatus === 'done') side.done += 1;
        }
        if (withSide.total < minEach || withoutSide.total < minEach) continue;
        const withPercent = pct(withSide.done, withSide.total);
        const withoutPercent = pct(withoutSide.done, withoutSide.total);
        const gap = withPercent - withoutPercent;
        if (gap < minGap) continue;
        found.push({ kind, from, to, withPercent, withoutPercent, days: withSide.total + withoutSide.total, gap });
      }
    }
  }
  // Same-day ties go both ways: keep one direction per pair (the stronger).
  const kept = found.filter(
    (p) =>
      p.kind === 'next_day' ||
      !found.some(
        (q) => q.kind === 'same_day' && q.from === p.to && q.to === p.from && (q.gap > p.gap || (q.gap === p.gap && q.from < p.from)),
      ),
  );
  return kept
    .sort((a, b) => b.gap - a.gap || b.days - a.days)
    .slice(0, max)
    .map(({ gap: _gap, ...pattern }) => pattern);
}
