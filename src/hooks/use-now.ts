import { useEffect, useMemo, useState } from 'react';

import { addDays, formatLocalDate, parseLocalDate } from '@/lib/recurrence';

/** Current time, refreshed every minute so bands, "today" and the now-line stay fresh. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/** Stable [today, tomorrow) range that only changes when the calendar day changes. */
export function useTodayRange(now: Date) {
  const dateKey = formatLocalDate(now);
  return useMemo(() => {
    const today = parseLocalDate(dateKey);
    return { today, tomorrow: addDays(today, 1) };
  }, [dateKey]);
}
