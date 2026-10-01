import PostHog from 'posthog-react-native';
import { Platform } from 'react-native';

import { storage } from '@/lib/storage';

/**
 * Product analytics (PostHog), privacy first: no autocapture, no session replay,
 * no emails and no habit names — only the events below, tied to the internal
 * Supabase user id (pseudonymous, not anonymous). Without `EXPO_PUBLIC_POSTHOG_KEY` every call is a no-op.
 */

type EventProps = Record<string, string | number | boolean | null>;

/** Every event the app may send. Adding one means updating the privacy policy if it adds new data. */
export type AnalyticsEvent =
  | 'onboarding_completed'
  | 'habit_created'
  | 'checkin_logged'
  | 'day_completed'
  | 'reminder_opened'
  | 'habit_actions_opened'
  | 'coach_tip_shown'
  | 'coach_tip_action'
  | 'coach_tip_dismissed'
  | 'coach_why_opened'
  | 'coach_tip_expanded'
  | 'north_star_answered'
  | 'north_star_snoozed'
  | 'ai_review_enabled'
  | 'ai_review_disabled'
  | 'ai_review_declined'
  | 'ai_review_read'
  | 'habit_branch_assigned'
  | 'social_profile_created'
  | 'friend_request_sent'
  | 'friend_added'
  | 'cheer_sent'
  | 'circle_created'
  | 'circle_joined'
  | 'user_blocked'
  | 'user_reported';

const OPT_OUT_KEY = 'habia.analytics.optOut';
const apiKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;

const client = apiKey
  ? new PostHog(apiKey, {
      host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
      // "Application Opened" / "Backgrounded" feed D1/D7/D30 retention.
      captureAppLifecycleEvents: true,
      enableSessionReplay: false,
      defaultOptIn: storage.getItem(OPT_OUT_KEY) !== '1',
      // On web PostHog finds no storage of its own and throws at startup; give it localStorage.
      ...(Platform.OS === 'web' ? { customStorage: storage } : {}),
    })
  : null;

/** False when no PostHog key is set (local dev): nothing would be sent. */
export const analyticsConfigured = client !== null;

export function track(event: AnalyticsEvent, props?: EventProps) {
  client?.capture(event, props);
}

export function trackScreen(pathname: string) {
  client?.screen(pathname);
}

/** Links events to the signed-in user by id only; `null` on sign-out starts a fresh anonymous id. */
export function identifyUser(userId: string | null) {
  if (!client) return;
  if (userId) client.identify(userId);
  else {
    // `reset()` also clears the opt-out flag: re-apply it so signing out never re-enables tracking.
    client.reset();
    if (!isAnalyticsEnabled()) client.optOut();
  }
}

export function isAnalyticsEnabled() {
  return storage.getItem(OPT_OUT_KEY) !== '1';
}

export function setAnalyticsEnabled(enabled: boolean) {
  storage.setItem(OPT_OUT_KEY, enabled ? '0' : '1');
  if (enabled) client?.optIn();
  else client?.optOut();
}
