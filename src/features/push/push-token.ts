import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { storage } from '@/lib/storage';
import { supabase } from '@/lib/supabase/client';

const TOKEN_KEY = 'habia.pushToken';

/**
 * Registers this device for social pushes, only when notifications are already allowed (asking
 * is left to the moments that explain why). The server keeps one account per device token.
 */
export async function registerPushToken(): Promise<void> {
  try {
    const permission = await Notifications.getPermissionsAsync();
    if (!permission.granted) return;
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: Platform.OS });
    if (!error) storage.setItem(TOKEN_KEY, token);
  } catch {
    // Simulators and devices without push credentials have no token: pushes simply stay off.
  }
}

/** Before signing out: this phone stops receiving the account's pushes. */
export async function unregisterPushToken(): Promise<void> {
  const token = storage.getItem(TOKEN_KEY);
  if (!token) return;
  storage.removeItem(TOKEN_KEY);
  await supabase.from('push_tokens').delete().eq('token', token);
}
