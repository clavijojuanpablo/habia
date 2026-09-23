import '@/lib/i18n';

import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/theme';
import { AppearanceProvider, useAppearance } from '@/features/appearance/appearance-provider';
import { SessionProvider, useSession } from '@/features/auth/session-provider';
import { useProfile } from '@/features/profile/api';
import { startNetworkWatcher } from '@/lib/network';
import { persister, queryClient } from '@/lib/query/client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(startNetworkWatcher, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 7 * 24 * 60 * 60 * 1000 }}
      // Replays check-ins that were queued while offline, even across restarts.
      onSuccess={() => queryClient.resumePausedMutations()}>
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
  const { session, isLoading } = useSession();
  const { data: profile, isLoading: profileLoading } = useProfile();
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

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const modal = (title: string) => ({ presentation: 'modal' as const, headerShown: true, title });

  return (
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
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
      {/* Reachable in both states: email links land here, before and after sign-in. */}
      <Stack.Screen name="auth-callback" />
      <Stack.Screen name="reset-password" />
    </Stack>
  );
}
