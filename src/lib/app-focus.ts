import { focusManager } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

/**
 * Tells TanStack Query when the app comes back to the foreground, so stale data (a cheer, a
 * friend request, a circle's day) refetches on return. On the web the window focus already does it.
 */
export function startAppFocusWatcher() {
  if (Platform.OS === 'web') return () => {};
  const subscription = AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
  return () => subscription.remove();
}
