import { isValidTimeZone, toZonedFloating } from './zoned';

const reads = (d: Date) =>
  [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()].map((n) => String(n).padStart(2, '0')).join('-');

describe('toZonedFloating', () => {
  it('reads an instant as wall-clock time in the given zone', () => {
    const instant = new Date('2026-09-30T12:30:00Z');
    expect(reads(toZonedFloating(instant, 'America/Bogota'))).toBe('2026-09-30-07-30');
    expect(reads(toZonedFloating(instant, 'Asia/Tokyo'))).toBe('2026-09-30-21-30');
    expect(reads(toZonedFloating(instant, 'UTC'))).toBe('2026-09-30-12-30');
  });

  it('crosses the date line the zone sees', () => {
    // 03:00 UTC on Oct 1 is still Sep 30 in Bogotá (UTC-5).
    expect(reads(toZonedFloating(new Date('2026-10-01T03:00:00Z'), 'America/Bogota'))).toBe('2026-09-30-22-00');
  });

  it('follows daylight saving time', () => {
    // Madrid is UTC+2 in summer and UTC+1 in winter.
    expect(reads(toZonedFloating(new Date('2026-07-01T10:00:00Z'), 'Europe/Madrid'))).toBe('2026-07-01-12-00');
    expect(reads(toZonedFloating(new Date('2026-12-01T10:00:00Z'), 'Europe/Madrid'))).toBe('2026-12-01-11-00');
  });

  it('falls back to UTC for an unknown zone', () => {
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
    expect(reads(toZonedFloating(new Date('2026-09-30T12:30:00Z'), 'Mars/Olympus'))).toBe('2026-09-30-12-30');
  });
});
