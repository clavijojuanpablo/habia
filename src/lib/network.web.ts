import { onlineManager } from '@tanstack/react-query';

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
