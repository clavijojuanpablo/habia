import { getDayBand } from './day-bands';

describe('getDayBand', () => {
  it.each([
    [5, 'morning'],
    [11, 'morning'],
    [12, 'afternoon'],
    [18, 'afternoon'],
    [19, 'night'],
    [2, 'night'],
  ] as const)('hour %i → %s', (hour, band) => {
    expect(getDayBand(hour)).toBe(band);
  });

  it('respects a custom config', () => {
    const config = { morningStartsAt: 7, afternoonStartsAt: 13, nightStartsAt: 20 };
    expect(getDayBand(6, config)).toBe('night');
    expect(getDayBand(19, config)).toBe('afternoon');
  });
});
