import { useEffect, useState } from 'react';

import { useProfile, useUpdateProfile } from '@/features/profile/api';
import { track } from '@/lib/analytics';
import { daysBetween } from '@/lib/recurrence';
import { storage } from '@/lib/storage';

import {
  useGenerateWeeklyReview,
  useMarkReviewSeen,
  useWeeklyReview,
  useWeeklyReviewAvailable,
  type WeeklyReview,
} from './weekly-review-api';

const OFFER_CLOSED_KEY = 'habia.aiReview.offerClosed';
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
  const [offerClosed, setOfferClosed] = useState(() => storage.getItem(OFFER_CLOSED_KEY) === '1');
  const enabled = profile?.ai_coach_enabled === true;
  const onboardedDays = profile?.onboarded_at ? daysBetween(new Date(profile.onboarded_at), today) : 0;
  const mayOffer = !offerClosed && onboardedDays >= OFFER_AFTER_DAYS;
  const available = useWeeklyReviewAvailable(enabled || mayOffer).data === true;
  const review = useWeeklyReview(today, enabled && available);
  const { mutate: writeReview, isIdle, isPending } = useGenerateWeeklyReview(today);
  const markSeen = useMarkReviewSeen(today);
  const updateProfile = useUpdateProfile();

  // A network call, not state: once per session and week (a failure waits for the next launch).
  const missing = settled && enabled && available && review.data?.status === 'none' && isIdle;
  useEffect(() => {
    if (missing) writeReview();
  }, [missing, writeReview]);

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
      storage.setItem(OFFER_CLOSED_KEY, '1');
      setOfferClosed(true);
    },
    markSeen: (id: string) => {
      track('ai_review_read');
      markSeen.mutate(id);
    },
  };
}
