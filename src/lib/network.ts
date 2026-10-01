import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

type State = Network.NetworkState;

/**
 * expo-network reports `isInternetReachable` as null/undefined while it is still probing:
 * that is "unknown", not "offline", so fall back to the plain connection flag.
 */
const isOnline = (state: State) => state.isInternetReachable ?? state.isConnected ?? true;

/** Reads the connection once and tells TanStack Query; resolves when it knows. */
export async function syncOnlineState() {
  try {
    onlineManager.setOnline(isOnline(await Network.getNetworkStateAsync()));
  } catch {
    onlineManager.setOnline(true);
  }
}

/**
 * Tells TanStack Query whether there is a connection. Without this, React Native
 * assumes it is always online and writes fail instead of waiting in the queue.
 */
export function startNetworkWatcher() {
  syncOnlineState();
  const subscription = Network.addNetworkStateListener((state) => onlineManager.setOnline(isOnline(state)));
  return () => subscription.remove();
}
