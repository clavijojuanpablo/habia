import { formatHour, formatHourRange, formatTimeLabel, usesTwelveHour } from './format';

describe('hour formatting', () => {
  it('detects the clock the locale uses', () => {
    expect(usesTwelveHour('en-US')).toBe(true);
    expect(usesTwelveHour('es-ES')).toBe(false);
  });

  it('formats 24-hour locales as HH:00', () => {
    expect(formatHour(6, 'es-ES')).toBe('06:00');
    expect(formatHour(21, 'es-ES')).toBe('21:00');
    expect(formatHour(24, 'es-ES')).toBe('00:00');
  });

  it('formats 12-hour locales with am/pm', () => {
    expect(formatHour(6, 'en-US')).toMatch(/6\s?am/);
    expect(formatHour(21, 'en-US')).toMatch(/9\s?pm/);
  });

  it('builds a range for the band header', () => {
    expect(formatHourRange(6, 12, 'es-ES')).toBe('06:00 – 12:00');
  });

  it('formats a stored HH:MM time', () => {
    expect(formatTimeLabel('07:30', 'es-ES')).toBe('07:30');
    expect(formatTimeLabel('07:30', 'en-US')).toMatch(/7:30\s?am/);
  });
});
