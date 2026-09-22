/**
 * Day bands split the day into morning / afternoon / night so the UI can paint
 * them differently and group habits by the moment they happen.
 */

export type DayBand = 'morning' | 'afternoon' | 'night';

export type DayBandConfig = {
  morningStartsAt: number;
  afternoonStartsAt: number;
  nightStartsAt: number;
  /** When the day ends (≈ bedtime), 1–24; 24 = midnight. Later hours are "sleep". */
  nightEndsAt: number;
};

export const DEFAULT_DAY_BANDS: DayBandConfig = {
  morningStartsAt: 5,
  afternoonStartsAt: 12,
  nightStartsAt: 19,
  nightEndsAt: 24,
};

export const DAY_BANDS: DayBand[] = ['morning', 'afternoon', 'night'];

/** Band for a local hour (0–23). Anything outside morning/afternoon is night. */
export function getDayBand(hour: number, config: DayBandConfig = DEFAULT_DAY_BANDS): DayBand {
  if (hour >= config.morningStartsAt && hour < config.afternoonStartsAt) return 'morning';
  if (hour >= config.afternoonStartsAt && hour < config.nightStartsAt) return 'afternoon';
  return 'night';
}

export function dayBandsFromProfile(profile?: {
  morning_starts_at: number;
  afternoon_starts_at: number;
  night_starts_at: number;
  night_ends_at: number;
} | null): DayBandConfig {
  if (!profile) return DEFAULT_DAY_BANDS;
  return {
    morningStartsAt: profile.morning_starts_at,
    afternoonStartsAt: profile.afternoon_starts_at,
    nightStartsAt: profile.night_starts_at,
    nightEndsAt: profile.night_ends_at,
  };
}

export type HourSegment = { band: DayBand; hours: number[] };

/**
 * Hours to show in a day view: from the start of the morning to the end of the
 * night, grouped into consecutive runs of the same band. The range stretches to
 * include any `occupiedHours` outside it, so a habit is never hidden.
 */
export function visibleHourSegments(config: DayBandConfig, occupiedHours: number[] = []): HourSegment[] {
  const start = Math.min(config.morningStartsAt, ...occupiedHours);
  const end = Math.max(config.nightEndsAt, ...occupiedHours.map((h) => h + 1));

  const segments: HourSegment[] = [];
  for (let hour = start; hour < end; hour++) {
    const band = getDayBand(hour, config);
    const last = segments[segments.length - 1];
    if (last?.band === band) last.hours.push(hour);
    else segments.push({ band, hours: [hour] });
  }
  return segments;
}
