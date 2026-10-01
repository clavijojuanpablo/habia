import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import { SocialError, useSendFriendRequest } from '../api';
import { normalizeUsername } from '../username';
import { SocialCard } from './social-card';

export const inviteLink = (username: string) => `https://habia.app/add/${username}`;

/** Add by exact username, or share your own link. There is no search, on purpose (privacy). */
export function AddFriend({ myUsername }: { myUsername: string }) {
  const { t } = useTranslation();
  const send = useSendFriendRequest();
  const [username, setUsername] = useState('');

  const errorCode = send.error instanceof SocialError ? send.error.code : send.error ? 'generic' : null;
  const result = send.data;

  return (
    <SocialCard>
      <ThemedText type="heading">🤝 {t('social.add.title')}</ThemedText>
      <TextField
        placeholder={t('social.add.placeholder')}
        value={username}
        onChangeText={(text) => {
          setUsername(normalizeUsername(text));
          send.reset();
        }}
        autoCapitalize="none"
        autoCorrect={false}
        maxLength={20}
        returnKeyType="send"
        onSubmitEditing={() => username.length >= 3 && send.mutate(username)}
      />
      {errorCode && (
        <ThemedText type="small" themeColor="danger">
          {t(`social.errors.${errorCode}`)}
        </ThemedText>
      )}
      {result && (
        <ThemedText type="small" themeColor="primary">
          {t(`social.add.result.${result}`)}
        </ThemedText>
      )}
      <View style={styles.row}>
        <Button
          style={styles.flex}
          label={t('social.add.send')}
          disabled={username.length < 3}
          loading={send.isPending}
          onPress={() => send.mutate(username)}
        />
        <Button
          style={styles.flex}
          variant="secondary"
          label={t('social.add.share')}
          onPress={() => Share.share({ message: t('social.add.shareMessage', { link: inviteLink(myUsername) }) })}
        />
      </View>
    </SocialCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two },
  flex: { flex: 1 },
});
