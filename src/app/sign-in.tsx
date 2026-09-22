import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase/client';

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
    const credentials = { email: email.trim(), password };
    const { data, error } =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);
    setLoading(false);

    if (error) setMessage({ text: error.message, isError: true });
    else if (mode === 'signUp' && !data.session) setMessage({ text: t('auth.checkEmail'), isError: false });
  };

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.hero}>
            <ThemedText style={styles.seed}>🌱</ThemedText>
            <ThemedText type="subtitle" style={styles.center}>
              {t('auth.title')}
            </ThemedText>
          </View>

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
          <Pressable onPress={() => setMode(mode === 'signIn' ? 'signUp' : 'signIn')}>
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              {mode === 'signIn' ? t('auth.switchToSignUp') : t('auth.switchToSignIn')}
            </ThemedText>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.four, maxWidth: MaxContentWidth },
  seed: { fontSize: 64, lineHeight: 76 },
  center: { textAlign: 'center' },
});
