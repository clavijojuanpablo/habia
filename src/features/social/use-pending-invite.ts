import * as Linking from 'expo-linking';
import { router, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import { storage } from '@/lib/storage';

import { inviteRoute } from './invite-route';

const PENDING_INVITE_KEY = 'habia.pendingInvite';

export type AppGate = 'loading' | 'signedOut' | 'onboarding' | 'ready';

/** A day is plenty to sign up and onboard; an older invite (or someone else's on this phone) is dropped. */
const PENDING_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function readPending(): string | null {
  try {
    const { route, at } = JSON.parse(storage.getItem(PENDING_INVITE_KEY) ?? 'null') ?? {};
    return typeof route === 'string' && Date.now() - at < PENDING_MAX_AGE_MS ? route : null;
  } catch {
    return null;
  }
}

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
    if (route && gate !== 'ready') storage.setItem(PENDING_INVITE_KEY, JSON.stringify({ route, at: Date.now() }));
  }, [url, gate]);

  useEffect(() => {
    if (gate !== 'ready') return;
    const pending = readPending();
    storage.removeItem(PENDING_INVITE_KEY);
    if (!pending) return;
    // After the guards swap sign-in for the tabs: a push in the same commit could be overridden.
    const timer = setTimeout(() => router.push(pending as Href), 300);
    return () => clearTimeout(timer);
  }, [gate]);
}
