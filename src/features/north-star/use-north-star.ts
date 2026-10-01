import { useState } from 'react';

import { useSession } from '@/features/auth/session-provider';
import { useProfile } from '@/features/profile/api';
import { analyticsConfigured, isAnalyticsEnabled, track } from '@/lib/analytics';
import { addDays, formatLocalDate } from '@/lib/recurrence';
import { storage } from '@/lib/storage';

import { type NorthStarState, shouldAskNorthStar, SNOOZE_DAYS } from './should-ask';

const THANKS_MS = 2500;

/** Per account: a second account on the same phone keeps its own schedule. */
const storageKey = (userId: string | undefined) => `habia.northStar.${userId ?? 'anonymous'}`;

function readState(key: string): NorthStarState {
  try {
    return (JSON.parse(storage.getItem(key) ?? 'null') as NorthStarState | null) ?? {};
  } catch {
    return {};
  }
}

/** The periodic "is habia helping?" question and the short thank-you after answering it. */
export function useNorthStar(today: Date) {
  const { session } = useSession();
  const key = storageKey(session?.user.id);
  const { data: profile } = useProfile();
  const [state, setState] = useState(() => readState(key));
  const [thanks, setThanks] = useState(false);

  const ask = shouldAskNorthStar({
    today,
    onboardedAt: profile?.onboarded_at ? new Date(profile.onboarded_at) : null,
    state,
    analyticsOn: analyticsConfigured && isAnalyticsEnabled(),
  });

  const save = (next: NorthStarState) => {
    storage.setItem(key, JSON.stringify(next));
    setState(next);
  };

  return {
    /** Asking, or thanking right after the answer. */
    visible: ask || thanks,
    thanks,
    answer: (score: number) => {
      track('north_star_answered', { score });
      save({ answeredOn: formatLocalDate(today) });
      setThanks(true);
      setTimeout(() => setThanks(false), THANKS_MS);
    },
    snooze: () => {
      track('north_star_snoozed');
      save({ ...state, snoozedUntil: formatLocalDate(addDays(today, SNOOZE_DAYS)) });
    },
  };
}
