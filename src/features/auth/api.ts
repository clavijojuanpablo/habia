import * as Linking from 'expo-linking';

import i18n from '@/lib/i18n';
import { supabase } from '@/lib/supabase/client';

/**
 * Where email links should send the user back to. In development this is an
 * `exp://…` URL, in the built app `habia://auth-callback`, and on web a localhost
 * or site URL. All of these are allow-listed in `supabase/config.toml`.
 */
export function authCallbackUrl(next?: 'reset') {
  return Linking.createURL('/auth-callback', { queryParams: next ? { next } : undefined });
}

export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: authCallbackUrl('reset'),
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
