import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import i18n from '@/lib/i18n';
import { supabase } from '@/lib/supabase/client';

/**
 * Where email links send the user back to (the templates in supabase/templates/
 * append `token_hash` and `type`). On a phone it is the Universal Link, which iOS
 * opens in the app; without the app, habia.app/auth-callback explains what to do.
 * On web it is this site's own route. Both are allow-listed in `supabase/config.toml`.
 */
export function authCallbackUrl() {
  return Platform.OS === 'web' ? Linking.createURL('/auth-callback') : 'https://habia.app/auth-callback';
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: authCallbackUrl(),
  });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    // `language` lets the auth email templates (supabase/templates/) speak the user's language.
    options: { emailRedirectTo: authCallbackUrl(), data: { language: i18n.language } },
  });
  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

/**
 * Deletes the account and all its data. Removing an auth user needs admin rights,
 * so the work happens in the `delete-account` Edge Function, which verifies the
 * caller's session and deletes only that user.
 */
export async function deleteAccount() {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
  await supabase.auth.signOut();
}
