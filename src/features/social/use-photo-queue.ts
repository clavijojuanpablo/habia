import { onlineManager, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { flushHabitPhotos, hasPendingPhotos } from './photos';

/**
 * Sends photos that could not be uploaded when they were taken: on launch, when the app comes
 * back to the foreground and when the connection returns. Mounted once, under the tabs.
 */
export function usePhotoQueue() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const flush = () => {
      if (!hasPendingPhotos() || !onlineManager.isOnline()) return;
      flushHabitPhotos().then(() => queryClient.invalidateQueries({ queryKey: ['social'] }));
    };
    flush();
    const appState = AppState.addEventListener('change', (state) => state === 'active' && flush());
    const unsubscribeOnline = onlineManager.subscribe((online) => online && flush());
    return () => {
      appState.remove();
      unsubscribeOnline();
    };
  }, [queryClient]);
}
