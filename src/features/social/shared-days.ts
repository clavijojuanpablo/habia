import { addDays, formatLocalDate, startOfWeek } from '@/lib/recurrence';

/** One person's day as the server shares it (`social_days`): planted something, rested on purpose, or both. */
export type DayMark = { user_id: string; day: string; active: boolean; skipped: boolean };

/** How many days back friends' days are fetched (the server caps it at 60). */
export const SHARED_WINDOW_DAYS = 60;

export type PersonDay = 'active' | 'rest' | 'empty' | 'future';

/** One person's week, Monday first: planted something, rested on purpose, nothing yet, or still ahead. */
export function computePersonWeek(userId: string, marks: DayMark[], today: Date): PersonDay[] {
  const seen = new Map(marks.map((m) => [`${m.user_id}:${m.day}`, m]));
  const monday = startOfWeek(today);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i)).map((date) => {
    if (date > today) return 'future';
    const mark = seen.get(`${userId}:${formatLocalDate(date)}`);
    return mark?.active ? 'active' : mark?.skipped ? 'rest' : 'empty';
  });
}
