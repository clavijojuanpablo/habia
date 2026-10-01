import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';

import { SocialError, useMySocialProfile } from '../api';

/**
 * Where an invite link lands (habia.app/add/…, habia.app/join/…): one clear question and one button.
 * Without a username yet, it sends you to pick one first.
 */
export function InviteLanding({
  title,
  body,
  actionLabel,
  onAction,
  pending,
  error,
  done,
}: {
  title: string;
  body: string;
  actionLabel: string;
  onAction: () => void;
  pending: boolean;
  error: unknown;
  done?: string | null;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const me = useMySocialProfile();
  const errorCode = error instanceof SocialError ? error.code : error ? 'generic' : null;

  return (
    <ThemedView style={styles.flex}>
      <View style={styles.content}>
        <Brote mood="cheer" size={96} />
        <ThemedText type="subtitle" style={styles.center}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {body}
        </ThemedText>
        {me.isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : !me.data ? (
          <>
            <ThemedText type="small" style={styles.center}>
              {t('social.invite.needUsername')}
            </ThemedText>
            <Button label={t('social.invite.pickUsername')} onPress={() => router.replace('/profile')} />
          </>
        ) : done ? (
          <>
            <ThemedText type="smallBold" themeColor="primary" style={styles.center}>
              {done}
            </ThemedText>
            <Button label={t('social.invite.goFriends')} onPress={() => router.replace('/profile')} />
          </>
        ) : (
          <Button label={actionLabel} loading={pending} onPress={onAction} />
        )}
        {errorCode && (
          <ThemedText type="small" themeColor="danger" style={styles.center}>
            {t(`social.errors.${errorCode}`)}
          </ThemedText>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    alignItems: 'stretch',
  },
  center: { textAlign: 'center', alignSelf: 'center' },
});
