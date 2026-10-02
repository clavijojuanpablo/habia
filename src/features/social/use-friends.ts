import { useMemo } from 'react';

import { useFriendships, useSocialProfiles, type SocialProfile } from './api';

/** Accepted friends with their public profile (name, color, stats snapshot), plus all friendships. */
export function useFriends() {
  const friendships = useFriendships();
  const accepted = useMemo(() => friendships.data?.filter((f) => f.status === 'accepted') ?? [], [friendships.data]);
  const profiles = useSocialProfiles(accepted.map((f) => f.user_id));
  const friends = useMemo(() => {
    const byId: Record<string, SocialProfile | undefined> = Object.fromEntries(
      (profiles.data ?? []).map((p) => [p.user_id, p]),
    );
    return accepted.map((friend) => ({ friend, profile: byId[friend.user_id] }));
  }, [accepted, profiles.data]);
  return { friends, friendships };
}
