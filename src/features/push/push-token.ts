import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase/client';

const TOKEN_KEY = 'habia.pushToken';
// Which account the stored token was registered for: a token is per device, not per account.
const OWNER_KEY = 'habia.pushTokenOwner';

/**
 * Registers this device for social pushes, only when notifications are already allowed (asking
 * is left to the moments that explain why). Runs on every return to the app, so a permission
 * granted later in Settings counts; the server call is skipped while token and account are the
 * same. The server keeps one account per device token.
 */
export async function registerPushToken(userId: string): Promise<void> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (storage.getItem(TOKEN_KEY) === token && storage.getItem(OWNER_KEY) === userId) return;
    const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
    if (error) return;
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(OWNER_KEY, userId);
  } catch {
    // Simulators and devices without push credentials have no token: pushes simply stay off.
  }
}

/** Before signing out: this phone stops receiving the account's pushes. */
export async function unregisterPushToken(): Promise<void> {
  const token = storage.getItem(TOKEN_KEY);
  if (!token) return;
  // Delete on the server first: forgetting the token locally on a failed delete would leave this
  // phone receiving the old account's pushes with no way to find the token again.
  const { error } = await supabase.from('push_tokens').delete().eq('token', token);
  if (error) return;
  storage.removeItem(TOKEN_KEY);
  storage.removeItem(OWNER_KEY);
}
