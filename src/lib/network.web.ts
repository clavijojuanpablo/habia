import { onlineManager } from '@tanstack/react-query';

/** The browser knows synchronously; kept async to match the native API. */
export async function syncOnlineState() {
  if (typeof window !== 'undefined') onlineManager.setOnline(navigator.onLine);
}

/** The browser already reports connectivity through `navigator.onLine` and events. */
export function startNetworkWatcher() {
  if (typeof window === 'undefined') return;

  const update = () => onlineManager.setOnline(navigator.onLine);
  update();
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  return () => {
    window.removeEventListener('online', update);
    window.removeEventListener('offline', update);
  };
}
