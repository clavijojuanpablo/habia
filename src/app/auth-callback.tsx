import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator } from 'react-native';

import { Button } from '@/components/button';
import { AuthLayout } from '@/features/auth/components/auth-layout';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase/client';

/**
 * Landing screen for the links in our auth emails (sign-up confirmation and
 * password recovery), usually opened as the Universal Link
 * https://habia.app/auth-callback. The templates (supabase/templates/) put a
 * one-time `token_hash` and its `type` in the link; verifying it signs the user in
 * on whichever device opens it, and `type=recovery` continues to the new-password screen.
 */
export default function AuthCallbackScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { token_hash: tokenHash, type } = useLocalSearchParams<{ token_hash?: string; type?: string }>();
  const [verifyError, setVerifyError] = useState<string | null>(null);
  // Derived, never stored: a link without a token is simply invalid.
  const error = verifyError ?? (tokenHash && type ? null : t('auth.linkInvalid'));

  const verified = useRef<string | null>(null);

  useEffect(() => {
    if (!tokenHash || !type || verified.current === tokenHash) return;
    verified.current = tokenHash;
    supabase.auth
      .verifyOtp({ token_hash: tokenHash, type: type === 'recovery' ? 'recovery' : 'email' })
      .then(({ error: failure }) => {
        if (failure) return setVerifyError(failure.message);
        // Signed in now: either continue to set a new password, or land in the app.
        router.replace(type === 'recovery' ? '/reset-password' : '/');
      })
      .catch(() => setVerifyError(t('common.error')));
  }, [tokenHash, type, t]);

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
