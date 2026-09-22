import { DEFAULT_DAY_BANDS, getDayBand, visibleHourSegments } from './day-bands';

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
    const config = { morningStartsAt: 7, afternoonStartsAt: 13, nightStartsAt: 20, nightEndsAt: 24 };
    expect(getDayBand(6, config)).toBe('night');
    expect(getDayBand(19, config)).toBe('afternoon');
  });
});

describe('visibleHourSegments', () => {
  const config = { morningStartsAt: 6, afternoonStartsAt: 12, nightStartsAt: 19, nightEndsAt: 23 };
  const summary = (segments: ReturnType<typeof visibleHourSegments>) =>
    segments.map((s) => [s.band, s.hours[0], s.hours[s.hours.length - 1]]);

  it('shows only the bands, from morning start to the end of the night', () => {
    expect(summary(visibleHourSegments(config))).toEqual([
      ['morning', 6, 11],
      ['afternoon', 12, 18],
      ['night', 19, 22],
    ]);
  });

  it('defaults to ending at midnight', () => {
    const segments = visibleHourSegments(DEFAULT_DAY_BANDS);
    expect(segments[segments.length - 1].hours.at(-1)).toBe(23);
  });

  it('stretches to include habits scheduled in sleep hours, never hiding them', () => {
    expect(summary(visibleHourSegments(config, [4, 23]))).toEqual([
      ['night', 4, 5],
      ['morning', 6, 11],
      ['afternoon', 12, 18],
      ['night', 19, 23],
    ]);
  });
});
