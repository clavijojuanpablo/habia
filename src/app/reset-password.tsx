import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { updatePassword } from '@/features/auth/api';
import { AuthLayout } from '@/features/auth/components/auth-layout';

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [repeat, setRepeat] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (password !== repeat) return setError(t('auth.passwordsDiffer'));
    setLoading(true);
    setError(null);
    try {
      await updatePassword(password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout emoji="🔐" title={t('auth.newPasswordTitle')} subtitle={t('auth.newPasswordSubtitle')}>
      <TextField
        label={t('auth.newPassword')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="new-password"
        autoFocus
      />
      <TextField
        label={t('auth.repeatPassword')}
        value={repeat}
        onChangeText={setRepeat}
        secureTextEntry
        autoComplete="new-password"
        error={error}
        onSubmitEditing={submit}
      />
      <Button label={t('common.save')} onPress={submit} loading={loading} disabled={password.length < 6} />
    </AuthLayout>
  );
}
