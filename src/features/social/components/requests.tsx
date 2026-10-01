import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import { useAcceptFriend, useRemoveFriendship, type Friendship } from '../api';
import { SocialAvatar } from './social-avatar';
import { SocialCard } from './social-card';

/** Pending requests: the ones to answer first, then the ones still waiting on someone else. */
export function Requests({ requests }: { requests: Friendship[] }) {
  const { t } = useTranslation();
  const accept = useAcceptFriend();
  const remove = useRemoveFriendship();
  if (requests.length === 0) return null;

  const sorted = [...requests].sort((a, b) => Number(b.incoming) - Number(a.incoming));
  return (
    <SocialCard>
      <ThemedText type="heading">✉️ {t('social.requests.title')}</ThemedText>
      {sorted.map((r) => (
        <View key={r.user_id} style={styles.request}>
          <View style={styles.row}>
            <SocialAvatar color={r.color} size={40} />
            <View style={styles.flex}>
              <ThemedText type="smallBold" numberOfLines={1}>
                {r.display_name}
              </ThemedText>
              <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
                @{r.username} · {t(r.incoming ? 'social.requests.incoming' : 'social.requests.outgoing')}
              </ThemedText>
            </View>
          </View>
          <View style={styles.row}>
            {r.incoming && (
              <Button
                style={styles.flex}
                label={t('social.requests.accept')}
                loading={accept.isPending && accept.variables === r.user_id}
                onPress={() => accept.mutate(r.user_id)}
              />
            )}
            <Button
              style={styles.flex}
              variant="secondary"
              label={t(r.incoming ? 'social.requests.decline' : 'social.requests.cancel')}
              loading={remove.isPending && remove.variables === r.user_id}
              onPress={() => remove.mutate(r.user_id)}
            />
          </View>
        </View>
      ))}
    </SocialCard>
  );
}

const styles = StyleSheet.create({
  request: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});
