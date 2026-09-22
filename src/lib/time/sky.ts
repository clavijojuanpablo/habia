import { getDayBand, type DayBandConfig } from './day-bands';

/**
 * 0–1 position of the sun across the daytime (morning → night start), or of the
 * moon across the night (night start → next morning).
 */
export function skyProgress(now: Date, bands: DayBandConfig): number {
  const hour = now.getHours() + now.getMinutes() / 60;
  const dayLength = bands.nightStartsAt - bands.morningStartsAt;

  if (getDayBand(now.getHours(), bands) !== 'night') {
    return (hour - bands.morningStartsAt) / dayLength;
  }
  const sinceNight = (hour - bands.nightStartsAt + 24) % 24;
  return sinceNight / (24 - dayLength);
}
