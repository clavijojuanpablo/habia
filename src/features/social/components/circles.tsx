import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

import { SocialError, useJoinCircle } from '../api';
import { SocialCard } from './social-card';

export const circleInviteLink = (code: string) => `https://habia.app/join/${code}`;

/** Join with a code someone shared (the link does the same). Creating one is a separate screen. */
export function CirclesActions() {
  const { t } = useTranslation();
  const join = useJoinCircle();
  const [code, setCode] = useState('');
  const errorCode = join.error instanceof SocialError ? join.error.code : join.error ? 'generic' : null;
  const submit = () =>
    join.mutate(code, { onSuccess: (id) => router.push({ pathname: '/circle/[id]', params: { id } }) });

  return (
    <SocialCard>
      <ThemedText type="small" themeColor="textSecondary">
        {t('social.circle.intro')}
      </ThemedText>
      <Button label={t('social.circle.create')} onPress={() => router.push('/circle/new')} />
      <View style={styles.joinRow}>
        <View style={styles.flex}>
          <TextField
            placeholder={t('social.circle.codePlaceholder')}
            value={code}
            onChangeText={(text) => {
              setCode(
                text
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .slice(0, 8),
              );
              join.reset();
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={() => code.length === 8 && submit()}
          />
        </View>
        <Button
          variant="secondary"
          label={t('social.circle.join')}
          disabled={code.length !== 8}
          loading={join.isPending}
          onPress={submit}
        />
      </View>
      {errorCode && (
        <ThemedText type="small" themeColor="danger">
          {t(`social.errors.${errorCode}`)}
        </ThemedText>
      )}
    </SocialCard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  joinRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
});
