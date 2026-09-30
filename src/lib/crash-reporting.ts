import * as Sentry from '@sentry/react-native';

/**
 * Crash and error reporting (Sentry). Without `EXPO_PUBLIC_SENTRY_DSN` it stays
 * off, so development and forks work without an account. No personal data: the
 * user is known by their internal id, never by email.
 */
const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: !!dsn && !__DEV__,
  sendDefaultPii: false,
  // Crashes and errors only, as the privacy policy says: no performance traces or session pings.
  enableAutoSessionTracking: false,
});

export const wrapRoot = Sentry.wrap;

export function setCrashUser(userId: string | null) {
  Sentry.setUser(userId ? { id: userId } : null);
}
