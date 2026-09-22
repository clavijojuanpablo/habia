import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { sendPasswordReset } from '@/features/auth/api';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { useTheme } from '@/hooks/use-theme';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      emoji={sent ? '📬' : '🔑'}
      title={t('auth.forgotTitle')}
      subtitle={sent ? t('auth.resetSent', { email }) : t('auth.forgotSubtitle')}>
      {!sent && (
        <>
          <TextField
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            autoFocus
            onSubmitEditing={submit}
            error={error}
          />
          <Button label={t('auth.sendReset')} onPress={submit} loading={loading} disabled={!email} />
        </>
      )}

      <Pressable onPress={() => router.back()} hitSlop={8}>
        <ThemedText type="smallBold" style={[styles.center, { color: theme.primary }]}>
          {t('auth.backToSignIn')}
        </ThemedText>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({ center: { textAlign: 'center' } });
