import type { HabitGrowth } from "@/features/garden/compute-garden";
import type { Habit } from "@/features/habits/api";
import type {
  BandStat,
  DayStat,
  WeekStat,
} from "@/features/stats/compute-stats";
import { addDays } from "@/lib/recurrence";

import { computeTip, FACT_COUNT, type CoachInput } from "./compute-tip";

const TODAY = new Date(2026, 8, 30);

function growth(
  id: string,
  habit: Partial<Habit> = {},
  overrides: Partial<HabitGrowth> = {},
): HabitGrowth {
  return {
    habit: {
      id,
      name: `Habit ${id}`,
      two_minute_version: "one page",
      implementation_intention: "after coffee",
      ...habit,
    } as Habit,
    completions: 10,
    recentCompletions: 5,
    streak: 3,
    atRisk: false,
    trailingMisses: 0,
    consistency: 0.8,
    recentDue: 20,
    automaticity: 0.2,
    flowers: 1,
    ...overrides,
  };
}

/** One DayStat per entry, ending today; each entry is [due, done]. */
function days(entries: [number, number][]): DayStat[] {
  return entries.map(([due, done], i) => ({
    date: addDays(TODAY, i - entries.length + 1),
    due,
    done,
    ratio: due === 0 ? null : done / due,
  }));
}

const band = (b: BandStat["band"], due: number, done: number): BandStat => ({
  band: b,
  due,
  done,
  ratio: done / due,
});
const week = (due: number, done: number): WeekStat => ({
  weekStart: TODAY,
  due,
  done,
  ratio: due ? done / due : null,
});

function input(overrides: Partial<CoachInput> = {}): CoachInput {
  return {
    growth: [growth("a")],
    days: days([
      [2, 2],
      [2, 2],
      [2, 0],
    ]),
    bands: [],
    weeks: [],
    pendingToday: [],
    today: TODAY,
    ...overrides,
  };
}

describe("computeTip", () => {
  it("gives no tip without habits", () => {
    expect(computeTip(input({ growth: [] }))).toBeNull();
  });

  it("nudges the 2-minute version when the last occurrence was missed and today is open", () => {
    const tip = computeTip(
      input({
        growth: [growth("a", {}, { atRisk: true, trailingMisses: 1 })],
        pendingToday: ["a"],
      }),
    );
    expect(tip).toEqual({
      rule: "never_miss_twice",
      habitId: "a",
      name: "Habit a",
      minimum: "one page",
    });
  });

  it("does not nudge an at-risk habit that is not due today", () => {
    const tip = computeTip(
      input({
        growth: [growth("a", {}, { atRisk: true, trailingMisses: 1 })],
        pendingToday: [],
      }),
    );
    expect(tip?.rule).not.toBe("never_miss_twice");
  });

  it('does not call two misses in a row "an accident": the comeback rule speaks instead', () => {
    const tip = computeTip(
      input({
        growth: [growth("a", {}, { atRisk: true, trailingMisses: 2 })],
        pendingToday: ["a"],
        days: days([
          [1, 1],
          [1, 0],
          [1, 0],
          [1, 0],
        ]),
      }),
    );
    expect(tip).toEqual({ rule: "comeback" });
  });

  it("welcomes back after two missed days with earlier momentum", () => {
    const tip = computeTip(
      input({
        days: days([
          [2, 1],
          [2, 0],
          [0, 0], // a rest day does not count as a miss…
          [2, 0],
          [2, 0],
        ]),
      }),
    );
    expect(tip).toEqual({ rule: "comeback" });
  });

  it("does not welcome back once something is done today", () => {
    const tip = computeTip(
      input({
        days: days([
          [2, 1],
          [2, 0],
          [2, 0],
          [2, 1],
        ]),
      }),
    );
    expect(tip?.rule).not.toBe("comeback");
  });

  it.each([
    [33, "half"],
    [62, "close"],
    [66, "fruit"],
  ])(
    "marks the automaticity journey at %i completions (%s)",
    (completions, stage) => {
      const tip = computeTip(
        input({ growth: [growth("a", {}, { completions })] }),
      );
      expect(tip).toMatchObject({ rule: "automaticity", completions, stage });
    },
  );

  it("stays quiet about automaticity between milestones", () => {
    expect(
      computeTip(input({ growth: [growth("a", {}, { completions: 40 })] }))
        ?.rule,
    ).toBe("fact");
  });

  it("suggests a 2-minute version first, then an implementation intention, for the weakest habit", () => {
    const weak = growth(
      "w",
      { two_minute_version: null, implementation_intention: null },
      { consistency: 0.2 },
    );
    const meh = growth("m", { two_minute_version: null }, { consistency: 0.4 });
    expect(computeTip(input({ growth: [meh, weak] }))).toEqual({
      rule: "add_minimum",
      habitId: "w",
      name: "Habit w",
      percent: 20,
    });

    const hasMinimum = growth(
      "w",
      { implementation_intention: null },
      { consistency: 0.2 },
    );
    expect(computeTip(input({ growth: [hasMinimum] }))).toMatchObject({
      rule: "add_intention",
      habitId: "w",
    });
  });

  it("ignores low consistency built on too few occurrences", () => {
    const fresh = growth(
      "a",
      { two_minute_version: null },
      { consistency: 0, recentDue: 3 },
    );
    expect(computeTip(input({ growth: [fresh] }))?.rule).toBe("fact");
  });

  it("points out the best and worst day band when the gap is large", () => {
    const tip = computeTip(
      input({
        bands: [
          band("morning", 10, 9),
          band("night", 10, 4),
          band("anytime", 2, 0),
        ],
      }),
    );
    expect(tip).toEqual({
      rule: "best_band",
      best: "morning",
      worst: "night",
      bestPercent: 90,
      worstPercent: 40,
    });
  });

  it("celebrates a clearly better week", () => {
    expect(computeTip(input({ weeks: [week(10, 5), week(10, 8)] }))).toEqual({
      rule: "week_up",
      thisWeek: 80,
      lastWeek: 50,
    });
    expect(
      computeTip(input({ weeks: [week(20, 15), week(10, 8)] }))?.rule,
    ).toBe("fact");
  });

  it("follows the priority order", () => {
    const tip = computeTip(
      input({
        growth: [
          growth(
            "a",
            { two_minute_version: null },
            {
              atRisk: true,
              trailingMisses: 1,
              consistency: 0.1,
              completions: 33,
            },
          ),
        ],
        pendingToday: ["a"],
        weeks: [week(10, 5), week(10, 8)],
      }),
    );
    expect(tip?.rule).toBe("never_miss_twice");
  });

  it("falls back to a science fact that is stable for the day and changes the next", () => {
    const a = computeTip(input());
    const b = computeTip(input());
    const next = computeTip(input({ today: addDays(TODAY, 1) }));
    expect(a).toEqual(b);
    expect(a).toMatchObject({ rule: "fact" });
    expect(next).not.toEqual(a);
    if (a?.rule === "fact") expect(a.index).toBeLessThan(FACT_COUNT);
  });
});
