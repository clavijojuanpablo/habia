import { useMemo } from 'react';

import { useSession } from '@/features/auth/session-provider';

import { useFriendships, useSocialDays, useSocialProfiles, type SocialProfile } from './api';
import { computeSharedStreak, type SharedStreak } from './shared-days';

/**
 * Accepted friends with their public profile and the streak grown together. `shared` stays null
 * until the days arrive, so nobody sees a "0 days together" that is only still loading.
 * Used by the Profile tab and the streak screen.
 */
export function useSharedStreaks(today: Date) {
  const { session } = useSession();
  const me = session?.user.id;
  const friendships = useFriendships();
  const accepted = useMemo(() => friendships.data?.filter((f) => f.status === 'accepted') ?? [], [friendships.data]);
  const friendIds = accepted.map((f) => f.user_id);
  const profiles = useSocialProfiles(friendIds);
  const days = useSocialDays(me && friendIds.length > 0 ? [me, ...friendIds] : [], today);

  const friends = useMemo(() => {
    const marks = days.data;
    const mine = marks?.filter((m) => m.user_id === me) ?? [];
    const profileById: Record<string, SocialProfile | undefined> = Object.fromEntries(
      (profiles.data ?? []).map((p) => [p.user_id, p]),
    );
    return accepted.map((friend) => ({
      friend,
      profile: profileById[friend.user_id],
      shared: marks
        ? computeSharedStreak(
            mine,
            marks.filter((m) => m.user_id === friend.user_id),
            today,
          )
        : (null as SharedStreak | null),
    }));
  }, [accepted, days.data, profiles.data, me, today]);

  return { friends, friendships, isLoading: friendships.isLoading };
}
