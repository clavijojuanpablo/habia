import {
  addDays,
  formatLocalDate,
  getOccurrences,
  parseRRule,
  startOfWeek,
  toRRule,
  type Frequency,
  type Schedulable,
} from './index';

// Monday 2026-09-21 → Sunday 2026-09-27
const MONDAY = new Date(2026, 8, 21);
const NEXT_MONDAY = addDays(MONDAY, 7);

function habit(overrides: Partial<Schedulable>): Schedulable {
  return { rrule: 'FREQ=DAILY', starts_on: '2026-09-01', window_start: null, window_end: null, ...overrides };
}

function days(occurrences: { at: Date }[]) {
  return occurrences.map((o) => formatLocalDate(o.at));
}

describe('toRRule / parseRRule', () => {
  it.each<[Frequency, string]>([
    [{ kind: 'daily' }, 'FREQ=DAILY'],
    [{ kind: 'interval_days', interval: 2 }, 'FREQ=DAILY;INTERVAL=2'],
    [{ kind: 'weekdays', days: ['TH', 'TU'] }, 'FREQ=WEEKLY;BYDAY=TU,TH'],
    [{ kind: 'interval_hours', interval: 3 }, 'FREQ=HOURLY;INTERVAL=3'],
  ])('round-trips %j', (frequency, rrule) => {
    expect(toRRule(frequency)).toBe(rrule);
    const parsed = parseRRule(rrule);
    expect(parsed.kind).toBe(frequency.kind);
  });

  it('normalizes interval 1 to daily', () => {
    expect(toRRule({ kind: 'interval_days', interval: 1 })).toBe('FREQ=DAILY');
  });

  it('falls back to daily for unknown rules', () => {
    expect(parseRRule('FREQ=YEARLY')).toEqual({ kind: 'daily' });
    expect(parseRRule('FREQ=WEEKLY;BYDAY=XX')).toEqual({ kind: 'daily' });
  });
});

describe('getOccurrences', () => {
  it('daily: one all-day occurrence per day', () => {
    const occ = getOccurrences(habit({}), MONDAY, NEXT_MONDAY);
    expect(occ).toHaveLength(7);
    expect(occ.every((o) => !o.hasTime)).toBe(true);
  });

  it('every other day is anchored at starts_on', () => {
    const occ = getOccurrences(habit({ rrule: 'FREQ=DAILY;INTERVAL=2', starts_on: '2026-09-22' }), MONDAY, NEXT_MONDAY);
    expect(days(occ)).toEqual(['2026-09-22', '2026-09-24', '2026-09-26']);
  });

  it('only Tuesdays and Thursdays', () => {
    const occ = getOccurrences(habit({ rrule: 'FREQ=WEEKLY;BYDAY=TU,TH' }), MONDAY, NEXT_MONDAY);
    expect(days(occ)).toEqual(['2026-09-22', '2026-09-24']);
  });

  it('every 3 hours inside the window', () => {
    const occ = getOccurrences(
      habit({ rrule: 'FREQ=HOURLY;INTERVAL=3', window_start: '08:00:00', window_end: '20:00:00' }),
      MONDAY,
      addDays(MONDAY, 1),
    );
    expect(occ.map((o) => o.at.getHours())).toEqual([8, 11, 14, 17, 20]);
    expect(occ.every((o) => o.hasTime)).toBe(true);
  });

  it('uses window_start as the time for daily habits', () => {
    const [first] = getOccurrences(habit({ window_start: '07:30' }), MONDAY, addDays(MONDAY, 1));
    expect(first.hasTime).toBe(true);
    expect([first.at.getHours(), first.at.getMinutes()]).toEqual([7, 30]);
  });

  it('does not produce occurrences before starts_on', () => {
    const occ = getOccurrences(habit({ starts_on: '2026-09-25' }), MONDAY, NEXT_MONDAY);
    expect(days(occ)).toEqual(['2026-09-25', '2026-09-26', '2026-09-27']);
  });

  it('keeps the wall-clock time across month boundaries', () => {
    const occ = getOccurrences(habit({ window_start: '06:00' }), new Date(2026, 9, 30), new Date(2026, 10, 3));
    expect(occ.map((o) => o.at.getHours())).toEqual([6, 6, 6, 6]);
  });
});

describe('startOfWeek', () => {
  it('returns Monday', () => {
    expect(formatLocalDate(startOfWeek(new Date(2026, 8, 27)))).toBe('2026-09-21');
    expect(formatLocalDate(startOfWeek(MONDAY))).toBe('2026-09-21');
  });
});
