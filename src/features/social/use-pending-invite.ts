import * as Linking from 'expo-linking';
import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import { storage } from '@/lib/storage';

import { inviteRoute } from './invite-route';

const PENDING_INVITE_KEY = 'habia.pendingInvite';

export type AppGate = 'loading' | 'signedOut' | 'onboarding' | 'ready';

/**
 * Invite links opened before the app can use them (signed out, or still onboarding) would be
 * lost: the protected routes send you elsewhere. Keep the invite and open it once you are in.
 * Each URL is looked at once, so an old link never comes back after signing out.
 */
export function usePendingInvite(gate: AppGate) {
  const url = Linking.useURL();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!url || gate === 'loading' || handled.current === url) return;
    handled.current = url;
    const route = inviteRoute(url);
    if (route && gate !== 'ready') storage.setItem(PENDING_INVITE_KEY, route);
  }, [url, gate]);

  useEffect(() => {
    if (gate !== 'ready') return;
    const pending = storage.getItem(PENDING_INVITE_KEY);
    if (!pending) return;
    storage.removeItem(PENDING_INVITE_KEY);
    router.push(pending as Href);
  }, [gate]);
}
