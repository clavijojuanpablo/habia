import type { HabitGrowth } from '@/features/garden/compute-garden';
import type { ScheduleBand } from '@/features/schedule/build-schedule';
import type { BandStat, DayStat, WeekStat } from '@/features/stats/compute-stats';
import type { DayBand, DayBandConfig } from '@/lib/time/day-bands';

import type { HabitHistory } from './history';

/**
 * What a detector found, with the numbers behind it. The words live in i18n
 * (`coach.*`); the numbers also feed the "¿Por qué?" line.
 */
export type TipBody =
  | {
      rule: 'never_miss_twice';
      habitId: string;
      name: string;
      minimum: string | null;
      /** Single misses in a row, most recent first, that were followed by a completion. */
      comebacks: number;
    }
  | { rule: 'comeback' }
  | { rule: 'usual_time'; habitId: string; name: string; minutes: number; sample: number }
  | {
      rule: 'weak_weekday';
      habitId: string;
      name: string;
      minimum: string | null;
      weekdayPercent: number;
      averagePercent: number;
      sample: number;
    }
  | { rule: 'automaticity'; habitId: string; name: string; completions: number; stage: 'half' | 'close' | 'fruit' }
  | { rule: 'add_minimum' | 'add_intention'; habitId: string; name: string; percent: number; sample: number }
  | { rule: 'week_up'; thisWeek: number; lastWeek: number }
  | { rule: 'projection'; habitId: string; name: string; completions: number; recent: number; eta: string }
  | { rule: 'agenda'; total: number; band: DayBand; count: number; percent: number }
  | {
      rule: 'best_band';
      best: ScheduleBand;
      worst: ScheduleBand;
      bestPercent: number;
      worstPercent: number;
    }
  | { rule: 'minimum_saved'; habitId: string; name: string; count: number; streak: number }
  | { rule: 'fact'; index: number };

export type CoachRule = TipBody['rule'];

/** The chosen tip: `key` identifies the insight (rule + habit), `variant` its phrasing. */
export type CoachTip = TipBody & { key: string; variant: number };

export type Candidate = { body: TipBody; key: string; score: number };

/** One occurrence on today's schedule. */
export type AgendaItem = { habitId: string; band: ScheduleBand; pending: boolean };

export type CoachInput = {
  growth: HabitGrowth[];
  history: HabitHistory[];
  /** Oldest → newest, today last (see `computeStats`). */
  days: DayStat[];
  bands: BandStat[];
  weeks: WeekStat[];
  agenda: AgendaItem[];
  bandConfig: DayBandConfig;
  today: Date;
  now: Date;
};

/** A tip shown on a given day, remembered so the same insight does not come back too soon. */
export type ShownTip = { date: string; key: string };
