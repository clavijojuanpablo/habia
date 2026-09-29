import { getCalendars } from 'expo-localization';
import { useEffect, useRef } from 'react';

import { useProfile, useUpdateProfile } from './api';

/** `getCalendars()` returns `timeZone: null` on web; `Intl` covers it there. */
const DEVICE_TIMEZONE: string | null =
  getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;

/**
 * Keeps `profiles.timezone` (defaults to 'UTC', never set anywhere else) in sync
 * with the device. Runs on every session, not only at signup, so it also
 * self-heals rows created before this existed and follows a permanent move.
 * Tries once per session: a failed update is not retried in a loop.
 */
export function useTimezoneSync() {
  const { data: profile } = useProfile();
  const { mutate } = useUpdateProfile();
  const attempted = useRef(false);
  const stored = profile?.timezone;

  useEffect(() => {
    if (attempted.current || !stored || !DEVICE_TIMEZONE || DEVICE_TIMEZONE === stored) return;
    attempted.current = true;
    mutate({ timezone: DEVICE_TIMEZONE });
  }, [stored, mutate]);
}
