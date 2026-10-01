import { addDays, daysBetween, formatLocalDate, getOccurrences, startOfWeek } from '@/lib/recurrence';

import { SHARED_WINDOW_DAYS, type CircleWeekRow } from './shared-days';

/** Who takes part in a shared habit, and since which local date. */
export type CircleHabitMember = { user_id: string; joined_on: string };
/** One participant's local day on the shared habit, as the server shares it. */
export type CircleHabitDay = { user_id: string; day: string; done: boolean; skipped: boolean };

/** met = enough people did it · short = not enough · rest = everyone rested · off = not scheduled. */
export type GroupDayState = 'met' | 'short' | 'rest' | 'off' | 'pending' | 'future';

/** How many must do it for the day to count: everyone up to two, then half (rounded up). */
export const neededFor = (active: number) => (active <= 2 ? active : Math.ceil(active / 2));

/** How many days back each person's consistency in the ranking looks. */
export const RANKING_DAYS = 30;

/**
 * Today's counter color: short of the group's threshold (the streak is at risk), reached it, or
 * nearly everyone (80 %+) is in.
 */
export function todayTier(done: number, needed: number, active: number): 'short' | 'met' | 'great' {
  if (active === 0 || done < needed) return 'short';
  return done >= Math.max(needed, Math.ceil(active * 0.8)) ? 'great' : 'met';
}

const percent = (done: number, expected: number) => (expected === 0 ? null : Math.round((done / expected) * 100));

/**
 * The group's side of a shared habit. A scheduled day counts when at least half of the people who
 * had joined and did not rest on purpose did it; one short day is forgiven, two in a row reset the
 * streak ("never miss twice"), unscheduled days and days everyone rested are neutral. Consistency
 * compares done / expected on closed days, this week against last week.
 */
export function computeCircleHabit(members: CircleHabitMember[], days: CircleHabitDay[], rrule: string, today: Date) {
  const first = addDays(today, -SHARED_WINDOW_DAYS);
  const scheduled = new Set(
    getOccurrences(
      { rrule, starts_on: formatLocalDate(first), window_start: null, window_end: null },
      first,
      addDays(today, 1),
    ).map((o) => formatLocalDate(o.at)),
  );
  const byKey = new Map(days.map((d) => [`${d.user_id}:${d.day}`, d]));

  const dayInfo = (date: Date) => {
    const key = formatLocalDate(date);
    const joined = members.filter((m) => m.joined_on <= key);
    const marks = joined.map((m) => byKey.get(`${m.user_id}:${key}`));
    const active = marks.filter((mark) => !mark?.skipped).length;
    const doers = joined.filter((_, i) => marks[i]?.done).map((m) => m.user_id);
    const needed = neededFor(active);
    let state: GroupDayState;
    if (!scheduled.has(key) || joined.length === 0) state = 'off';
    else if (active === 0) state = 'rest';
    else if (doers.length >= needed) state = 'met';
    else if (daysBetween(date, today) === 0) state = 'pending';
    else state = 'short';
    return { state, active, doers, needed };
  };

  let streak = 0;
  let misses = 0;
  for (let date = first; daysBetween(date, today) >= 0; date = addDays(date, 1)) {
    const { state } = dayInfo(date);
    if (state === 'met') {
      streak++;
      misses = 0;
    } else if (state === 'short' && ++misses >= 2) {
      streak = 0;
    }
  }

  const monday = startOfWeek(today);
  const weekOf = (start: Date) => Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const consistency = (dates: Date[]) => {
    let done = 0;
    let expected = 0;
    for (const date of dates) {
      if (daysBetween(date, today) <= 0) continue; // closed days only
      const info = dayInfo(date);
      if (info.state === 'off' || info.state === 'rest') continue;
      done += Math.min(info.doers.length, info.active);
      expected += info.active;
    }
    return percent(done, expected);
  };

  const week = weekOf(monday).map((date) => ({
    date,
    state: date > today ? ('future' as const) : dayInfo(date).state,
  }));
  const rows: CircleWeekRow[] = members.map((m) => ({
    userId: m.user_id,
    days: weekOf(monday).map((date) => {
      const key = formatLocalDate(date);
      if (date > today || m.joined_on > key) return 'future';
      const mark = byKey.get(`${m.user_id}:${key}`);
      return mark?.done ? 'active' : mark?.skipped ? 'rest' : 'empty';
    }),
  }));
  const now = dayInfo(today);

  // Each person's consistency over the last 30 days since they joined: closed days, plus today once done.
  const ranking = members
    .map((m) => {
      let done = 0;
      let expected = 0;
      for (let date = addDays(today, -(RANKING_DAYS - 1)); daysBetween(date, today) >= 0; date = addDays(date, 1)) {
        const key = formatLocalDate(date);
        if (!scheduled.has(key) || m.joined_on > key) continue;
        const mark = byKey.get(`${m.user_id}:${key}`);
        if (mark?.skipped) continue;
        const isToday = daysBetween(date, today) === 0;
        if (isToday && !mark?.done) continue;
        expected++;
        if (mark?.done) done++;
      }
      return { userId: m.user_id, done, percent: percent(done, expected), doneToday: !!byKey.get(`${m.user_id}:${formatLocalDate(today)}`)?.done };
    })
    .sort((a, b) => (b.percent ?? -1) - (a.percent ?? -1) || b.done - a.done);

  return {
    streak,
    week,
    rows,
    today: { state: now.state, done: now.doers.length, needed: now.needed, active: now.active, carriers: now.doers },
    ranking,
    thisWeek: consistency(weekOf(monday)),
    lastWeek: consistency(weekOf(addDays(monday, -7))),
  };
}
