import { getCalendars } from 'expo-localization';

/**
 * Hour formatting that follows the user's clock: "6 a. m." on a 12-hour clock,
 * "06:00" on a 24-hour one. Never hardcode one of them.
 */

/**
 * True when hours are written with am/pm. The device setting wins (a phone set
 * to 12 hours in Colombia must not get "19:00" just because the app is in "es");
 * the locale's convention is the fallback when the platform does not report it.
 */
export function usesTwelveHour(locale: string): boolean {
  const deviceUses24h = getCalendars()[0]?.uses24hourClock;
  if (typeof deviceUses24h === 'boolean') return !deviceUses24h;
  try {
    const parts = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).formatToParts(new Date(2020, 0, 1, 13));
    return parts.some((part) => part.type === 'dayPeriod');
  } catch {
    return false;
  }
}

/** Short label for a grid gutter: "6 pm" / "06:00". `hour` is 0–24. */
export function formatHour(hour: number, locale: string): string {
  const h = hour % 24;
  if (!usesTwelveHour(locale)) return `${String(h).padStart(2, '0')}:00`;
  try {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12: true })
      .format(new Date(2020, 0, 1, h))
      .replace(/\s+/g, ' ')
      .toLowerCase();
  } catch {
    return `${String(h).padStart(2, '0')}:00`;
  }
}

/** Range label for a band header: "06:00 – 12:00" / "6 am – 12 pm". */
export function formatHourRange(from: number, to: number, locale: string): string {
  return `${formatHour(from, locale)} – ${formatHour(to, locale)}`;
}

/** `HH:MM` as stored in the database → a label in the user's format. */
export function formatTimeLabel(value: string, locale: string): string {
  const [h, m] = value.split(':').map(Number);
  if (!usesTwelveHour(locale)) return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  try {
    return new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: true })
      .format(new Date(2020, 0, 1, h, m))
      .replace(/\s+/g, ' ')
      .toLowerCase();
  } catch {
    return value;
  }
}
