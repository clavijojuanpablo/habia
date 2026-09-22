import { skyProgress } from './sky';

const bands = { morningStartsAt: 6, afternoonStartsAt: 12, nightStartsAt: 18, nightEndsAt: 24 };
const at = (h: number, m = 0) => new Date(2026, 8, 21, h, m);

describe('skyProgress', () => {
  it('moves the sun from sunrise to sunset', () => {
    expect(skyProgress(at(6), bands)).toBe(0);
    expect(skyProgress(at(12), bands)).toBe(0.5);
    expect(skyProgress(at(17, 59), bands)).toBeCloseTo(1, 1);
  });

  it('moves the moon across the night, wrapping past midnight', () => {
    expect(skyProgress(at(18), bands)).toBe(0);
    expect(skyProgress(at(0), bands)).toBe(0.5);
    expect(skyProgress(at(5), bands)).toBeCloseTo(11 / 12);
  });
});
