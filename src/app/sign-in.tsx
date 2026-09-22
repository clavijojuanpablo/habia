import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { signInWithEmail, signUpWithEmail } from '@/features/auth/api';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { useTheme } from '@/hooks/use-theme';

export default function SignInScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const submit = async () => {
    setLoading(true);
    setMessage(null);
    try {
      if (mode === 'signIn') {
        await signInWithEmail(email, password);
      } else {
        const data = await signUpWithEmail(email, password);
        if (!data.session) setMessage({ text: t('auth.checkEmail'), isError: false });
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : t('common.error'), isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout emoji="🌱" title={t('auth.welcome')} subtitle={t('auth.title')}>
      <TextField
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
        textContentType={mode === 'signIn' ? 'password' : 'newPassword'}
        onSubmitEditing={submit}
      />

      {message && (
        <ThemedText type="small" style={{ color: message.isError ? theme.danger : theme.primary }}>
          {message.text}
        </ThemedText>
      )}

      <Button
        label={mode === 'signIn' ? t('auth.signIn') : t('auth.signUp')}
        onPress={submit}
        loading={loading}
        disabled={!email || password.length < 6}
      />

      {mode === 'signIn' && (
        <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8}>
          <ThemedText type="smallBold" style={[styles.center, { color: theme.primary }]}>
            {t('auth.forgotPassword')}
          </ThemedText>
        </Pressable>
      )}

      <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')} hitSlop={8}>
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {mode === 'signIn' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')}
        </ThemedText>
      </Pressable>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
});
