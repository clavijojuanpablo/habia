import { ThemedView } from '@/components/themed-view';
import { FriendsList } from '@/features/social/components/friends-list';

/** Your friends, one per row (opened from Profile). Also where old /friends links land. */
export default function FriendsScreen() {
  return (
    <ThemedView style={{ flex: 1 }}>
      <FriendsList />
    </ThemedView>
  );
}
