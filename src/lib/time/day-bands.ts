/**
 * Day bands split the day into morning / afternoon / night so the UI can paint
 * them differently and group habits by the moment they happen.
 */

export type DayBand = 'morning' | 'afternoon' | 'night';

export type DayBandConfig = {
  morningStartsAt: number;
  afternoonStartsAt: number;
  nightStartsAt: number;
};

export const DEFAULT_DAY_BANDS: DayBandConfig = {
  morningStartsAt: 5,
  afternoonStartsAt: 12,
  nightStartsAt: 19,
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
} | null): DayBandConfig {
  if (!profile) return DEFAULT_DAY_BANDS;
  return {
    morningStartsAt: profile.morning_starts_at,
    afternoonStartsAt: profile.afternoon_starts_at,
    nightStartsAt: profile.night_starts_at,
  };
}
