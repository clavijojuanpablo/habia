import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';

import { SocialError, useMySocialProfile } from '../api';
import { UsernameSetup } from './username-setup';

/**
 * Where an invite link lands (habia.app/add/…, habia.app/join/…): one clear question and one button.
 * Without a username yet, you pick one right here and carry on with the same invite.
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Brote mood="cheer" size={96} />
        <ThemedText type="subtitle" style={styles.center}>
          {title}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {body}
        </ThemedText>
        {me.isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : me.isError ? (
          // Offline with nothing cached: not the same as "you have no username yet".
          <>
            <ThemedText type="small" themeColor="danger" style={styles.center}>
              {t('social.errors.generic')}
            </ThemedText>
            <Button variant="secondary" label={t('social.invite.retry')} onPress={() => me.refetch()} />
          </>
        ) : !me.data ? (
          // Pick a username right here: once created, this same screen offers the invite.
          <>
            <ThemedText type="small" style={styles.center}>
              {t('social.invite.needUsername')}
            </ThemedText>
            <UsernameSetup />
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
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
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
