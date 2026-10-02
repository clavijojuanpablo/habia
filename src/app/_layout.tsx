// First: initializes i18n before anything renders.
import i18n from '@/lib/i18n';

import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { defaultShouldDehydrateQuery } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useSegments, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import { AppearanceProvider, useAppearance } from '@/features/appearance/appearance-provider';
import { SessionProvider, useSession } from '@/features/auth/session-provider';
import { useProfile } from '@/features/profile/api';
import { useTheme } from '@/hooks/use-theme';
import { useTimezoneSync } from '@/features/profile/use-timezone-sync';
import { usePendingInvite } from '@/features/social/use-pending-invite';
import { trackScreen } from '@/lib/analytics';
import { reportError, wrapRoot } from '@/lib/crash-reporting';
import { startAppFocusWatcher } from '@/lib/app-focus';
import { startNetworkWatcher, syncOnlineState } from '@/lib/network';
import { usePurchasesIdentity } from '@/lib/purchases';
import { persister, queryClient } from '@/lib/query/client';

SplashScreen.preventAutoHideAsync();

export default wrapRoot(RootLayout);

/**
 * Any screen that throws while rendering lands here instead of closing the app: the error is
 * sent to Sentry and shown (message + first stack lines) so a tester can report it, with a retry.
 * Plain components and the light palette only: providers (theme, fonts) may be what failed.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => reportError(error), [error]);
  const colors = Colors.light;
  const stack = (error.stack ?? '').split('\n').slice(0, 6).join('\n');
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.errorContent}>
      <Text style={[styles.errorTitle, { color: colors.text }]}>{i18n.t('crash.title')}</Text>
      <Text style={{ color: colors.textSecondary }}>{i18n.t('crash.body')}</Text>
      <Text selectable style={[styles.errorDetail, { color: colors.text, backgroundColor: colors.backgroundElement }]}>
        {error.message}
        {stack ? `\n\n${stack}` : ''}
      </Text>
      <Pressable onPress={retry} style={[styles.errorButton, { backgroundColor: colors.primary }]} accessibilityRole="button">
        <Text style={{ color: colors.onPrimary }}>{i18n.t('crash.retry')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function RootLayout() {
  useEffect(startNetworkWatcher, []);
  useEffect(startAppFocusWatcher, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        // Queries marked `meta: { persist: false }` (signed photo URLs, which expire) stay in memory.
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query) && query.meta?.persist !== false,
        },
      }}
      // Replays check-ins that were queued while offline, even across restarts. Learn the real
      // connection first: TanStack assumes "online" until told, and would burn the retries.
      onSuccess={() => syncOnlineState().then(() => queryClient.resumePausedMutations())}>
      <SessionProvider>
        <AppearanceProvider>
          <ThemedNavigation />
        </AppearanceProvider>
      </SessionProvider>
    </PersistQueryClientProvider>
  );
}

/** Feeds our tokens into React Navigation so headers, modals and backgrounds match. */
function ThemedNavigation() {
  const { mode } = useAppearance();
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;
  const colors = Colors[mode];

  return (
    <ThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          background: colors.background,
          card: colors.backgroundElement,
          text: colors.text,
          border: colors.border,
          primary: colors.primary,
        },
      }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
    </ThemeProvider>
  );
}

function RootNavigator() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { session, isLoading } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile();
  useTimezoneSync();
  usePurchasesIdentity(session?.user.id, isLoading);
  // The route pattern, not the URL: /join/[code] and /friend/[id] never send invite codes,
  // usernames or ids to analytics. Route groups like (tabs) are dropped.
  const segments = useSegments();
  const screen = '/' + segments.filter((part) => !part.startsWith('(')).join('/');
  useEffect(() => trackScreen(screen), [screen]);
  // First run: no habits yet, so we welcome the user before showing the app.
  const needsOnboarding = !!session && !!profile && !profile.onboarded_at;
  const [fontsLoaded, fontError] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  // Never block the app on a font failure: fall back to the system font.
  const ready = !isLoading && (fontsLoaded || !!fontError) && (!session || !profileLoading);
  // Once mounted, the Stack must stay mounted: unmounting it (e.g. a session arriving from an email
  // link before its profile loads) throws away the navigation state, like the reset-password screen
  // the link was heading to. Later waits are covered by an overlay instead.
  const [mounted, setMounted] = useState(false);
  if (ready && !mounted) setMounted(true);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  usePendingInvite(
    !ready || (session && !profile) ? 'loading' : !session ? 'signedOut' : needsOnboarding ? 'onboarding' : 'ready',
  );

  if (!mounted) return null;

  const modal = (title: string) => ({ presentation: 'modal' as const, headerShown: true, title });

  const stack = (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={needsOnboarding}>
        <Stack.Screen name="onboarding" />
      </Stack.Protected>
      <Stack.Protected guard={!!session && !needsOnboarding}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="habit/new" options={modal(t('habit.new'))} />
        <Stack.Screen name="habit/[id]" options={modal(t('habit.edit'))} />
        <Stack.Screen name="identity/new" options={modal(t('identity.new'))} />
        <Stack.Screen name="identity/[id]" options={modal(t('identity.edit'))} />
        <Stack.Screen name="streak" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={modal(t('settings.title'))} />
        <Stack.Screen name="circles" options={modal(t('social.circlesTitle'))} />
        <Stack.Screen name="friend/[id]" options={modal('')} />
        <Stack.Screen name="circle/[id]" options={modal('')} />
        <Stack.Screen name="circle/new" options={modal(t('social.circle.newTitle'))} />
        <Stack.Screen name="circle/habit-new" options={modal(t('social.circleHabit.newTitle'))} />
        <Stack.Screen name="add/[username]" options={modal('')} />
        <Stack.Screen name="join/[code]" options={modal('')} />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
      {/* Reachable in both states: email links and the legal documents. */}
      <Stack.Screen name="auth-callback" />
      <Stack.Screen name="legal/privacy" options={{ presentation: 'modal' }} />
      <Stack.Screen name="legal/terms" options={{ presentation: 'modal' }} />
      <Stack.Screen name="reset-password" />
    </Stack>
  );

  return (
    <>
      {stack}
      {/* A new session's profile is still loading: hide the tabs that would flash before onboarding. */}
      {!ready && (
        <View style={[StyleSheet.absoluteFill, styles.overlay, { backgroundColor: theme.background }]}>
          <ActivityIndicator color={theme.primary} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  overlay: { alignItems: 'center', justifyContent: 'center' },
  errorContent: { padding: Spacing.four, paddingTop: Spacing.six, gap: Spacing.three },
  errorTitle: { fontSize: 22, lineHeight: 28 },
  errorDetail: { padding: Spacing.three, borderRadius: Radius.md, fontSize: 12, lineHeight: 16 },
  errorButton: { padding: Spacing.three, borderRadius: Radius.lg, alignItems: 'center' },
});
