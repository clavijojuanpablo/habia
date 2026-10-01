import { addDays, daysBetween, parseLocalDate } from '@/lib/recurrence';

/** First ask after a week of use: before that, "is habia helping?" has no honest answer. */
export const FIRST_ASK_AFTER_DAYS = 7;
/** Then every two weeks: often enough to see a trend, rare enough not to nag. */
export const ASK_EVERY_DAYS = 14;
/** "Ahora no" asks again a few days later. */
export const SNOOZE_DAYS = 3;

/** What the phone remembers about the survey (dates as YYYY-MM-DD). */
export type NorthStarState = { answeredOn?: string; snoozedUntil?: string };

type Options = {
  today: Date;
  onboardedAt: Date | null;
  state: NorthStarState;
  /** Answers are only useful if analytics can send them. */
  analyticsOn: boolean;
};

/**
 * Whether to ask the north-star question today: "is habia helping you improve your
 * daily life?" The product's success metric is this self-report (PRD), not time in app.
 */
export function shouldAskNorthStar({ today, onboardedAt, state, analyticsOn }: Options): boolean {
  if (!analyticsOn || !onboardedAt) return false;
  if (daysBetween(onboardedAt, today) < FIRST_ASK_AFTER_DAYS) return false;
  if (state.snoozedUntil && parseLocalDate(state.snoozedUntil) > today) return false;
  if (state.answeredOn && addDays(parseLocalDate(state.answeredOn), ASK_EVERY_DAYS) > today) return false;
  return true;
}
