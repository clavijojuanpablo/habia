import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { Button } from '@/components/button';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase/client';

/**
 * Landing screen for the links Supabase sends by email (sign-up confirmation and
 * password recovery). The link carries a one-time `code` that we exchange for a
 * session (PKCE); `next=reset` continues to the new-password screen.
 */
export default function AuthCallbackScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { code, next, error_description: errorDescription } = useLocalSearchParams<{
    code?: string;
    next?: string;
    error_description?: string;
  }>();
  const [exchangeError, setExchangeError] = useState<string | null>(null);
  // Derived, never stored: a link without a code is simply invalid.
  const error = errorDescription ?? exchangeError ?? (code ? null : t('auth.linkInvalid'));

  useEffect(() => {
    if (!code) return;
    supabase.auth
      .exchangeCodeForSession(code)
      .then(({ error: failure }) => {
        if (failure) return setExchangeError(failure.message);
        // Signed in now: either continue to set a new password, or land in the app.
        router.replace(next === 'reset' ? '/reset-password' : '/');
      })
      .catch(() => setExchangeError(t('common.error')));
  }, [code, next, t]);

  if (error) {
    return (
      <AuthLayout emoji="⚠️" title={t('auth.linkProblem')} subtitle={error}>
        <Button label={t('auth.backToSignIn')} onPress={() => router.replace('/sign-in')} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout emoji="🌱" title={t('common.loading')}>
      <ActivityIndicator color={theme.primary} />
    </AuthLayout>
  );
}
