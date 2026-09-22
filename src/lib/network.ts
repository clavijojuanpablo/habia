import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

/**
 * Tells TanStack Query whether there is a connection. Without this, React Native
 * assumes it is always online and writes fail instead of waiting in the queue.
 */
export function startNetworkWatcher() {
  Network.getNetworkStateAsync()
    .then((state) => onlineManager.setOnline(!!state.isInternetReachable))
    .catch(() => onlineManager.setOnline(true));

  const subscription = Network.addNetworkStateListener((state) => {
    onlineManager.setOnline(!!state.isInternetReachable);
  });
  return () => subscription.remove();
}
