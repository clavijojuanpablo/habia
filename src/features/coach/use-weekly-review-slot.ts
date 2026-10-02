import { useEffect, useRef, useState } from 'react';

import { useSession } from '@/features/auth/session-provider';
import { useProfile, useUpdateProfile } from '@/features/profile/api';
import { track } from '@/lib/analytics';
import { daysBetween, formatLocalDate } from '@/lib/recurrence';
import { storage } from '@/lib/storage';

import {
  useGenerateWeeklyReview,
  useMarkReviewSeen,
  useWeeklyReview,
  useWeeklyReviewAvailable,
  type WeeklyReview,
} from './weekly-review-api';
import { lastWeekStart } from './weekly-summary';

// Per account: several people may share a phone. The shared key from before still counts as a
// "no" (it is consent to send data to Claude: an answer once given is respected).
const offerClosedKey = (userId: string | undefined) => `habia.aiReview.offerClosed.${userId ?? 'anon'}`;
const LEGACY_OFFER_CLOSED_KEY = 'habia.aiReview.offerClosed';
const wasClosed = (key: string) =>
  storage.getItem(key) === '1' || storage.getItem(LEGACY_OFFER_CLOSED_KEY) === '1';
/** Offer the review once there is a week of habits to talk about. */
const OFFER_AFTER_DAYS = 7;

export type WeeklyReviewSlot =
  | { kind: 'review'; review: WeeklyReview }
  | { kind: 'writing' }
  | { kind: 'offer' }
  | null;

/**
 * What the AI weekly review needs from Today's prompt slot: the unread review, a short
 * "writing…" while the server works, or (once) the opt-in offer. Writes last week's
 * review on its own the first time Today opens in a new week, once `settled` says yesterday
 * is logged: a review is written once per week and never rewritten, so an unlogged Sunday
 * must not freeze into it as a miss.
 */
export function useWeeklyReviewSlot(today: Date, settled: boolean) {
  const { data: profile } = useProfile();
  const { session } = useSession();
  const offerKey = offerClosedKey(session?.user.id);
  const [offerClosed, setOfferClosed] = useState(() => wasClosed(offerKey));
  const enabled = profile?.ai_coach_enabled === true;
  const onboardedDays = profile?.onboarded_at ? daysBetween(new Date(profile.onboarded_at), today) : 0;
  const mayOffer = !offerClosed && onboardedDays >= OFFER_AFTER_DAYS;
  const available = useWeeklyReviewAvailable(enabled || mayOffer).data === true;
  const review = useWeeklyReview(today, enabled && available);
  const { mutate: writeReview, isPending } = useGenerateWeeklyReview(today);
  // Which week this session already asked for: crossing into a new week with the app open asks again.
  const asked = useRef<string | null>(null);
  const week = formatLocalDate(lastWeekStart(today));
  const markSeen = useMarkReviewSeen(today);
  const updateProfile = useUpdateProfile();

  // A network call, not state: once per session and week (a failure waits for the next launch).
  const missing = settled && enabled && available && review.data?.status === 'none';
  useEffect(() => {
    if (!missing || asked.current === week) return;
    asked.current = week;
    writeReview();
  }, [missing, week, writeReview]);

  const slot: WeeklyReviewSlot =
    review.data?.status === 'ready' && !review.data.review.seen_at
      ? { kind: 'review', review: review.data.review }
      : isPending
        ? { kind: 'writing' }
        : available && !enabled && mayOffer
          ? { kind: 'offer' }
          : null;

  return {
    slot,
    accept: () => {
      track('ai_review_enabled');
      updateProfile.mutate({ ai_coach_enabled: true });
    },
    decline: () => {
      track('ai_review_declined');
      storage.setItem(offerKey, '1');
      setOfferClosed(true);
    },
    markSeen: (id: string) => {
      track('ai_review_read');
      markSeen.mutate(id);
    },
  };
}
