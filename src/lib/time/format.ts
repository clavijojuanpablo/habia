/**
 * Hour formatting that follows the user's language: "6 a. m." where the 12-hour
 * clock is used, "06:00" where the 24-hour clock is. Never hardcode one of them.
 */

/** True when the locale writes hours with am/pm. */
export function usesTwelveHour(locale: string): boolean {
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
