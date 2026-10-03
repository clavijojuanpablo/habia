import { useTranslation } from 'react-i18next';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useFriends } from '../use-friends';
import { useSocialRefresh } from '../use-social-refresh';
import { FriendRow } from './friend-row';

/** Every friend in one scrollable card, with pull-to-refresh. */
export function FriendsList() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { friends, friendships } = useFriends();
  const { refreshing, onRefresh } = useSocialRefresh();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
      {friendships.isLoading ? (
        <ActivityIndicator color={theme.primary} />
      ) : friends.length === 0 ? (
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {t('social.noFriendsShort')}
        </ThemedText>
      ) : (
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          {friends.map(({ friend, profile }) => (
            <FriendRow key={friend.user_id} friend={friend} profile={profile} />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three, boxShadow: Shadow.card },
  center: { textAlign: 'center' },
});
