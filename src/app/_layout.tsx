import '@/lib/i18n';

import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
  useFonts,
} from '@expo-google-fonts/nunito';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { Colors } from '@/constants/theme';
import { AppearanceProvider, useAppearance } from '@/features/appearance/appearance-provider';
import { SessionProvider, useSession } from '@/features/auth/session-provider';
import { queryClient } from '@/lib/query/client';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <AppearanceProvider>
          <ThemedNavigation />
        </AppearanceProvider>
      </SessionProvider>
    </QueryClientProvider>
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
  const [fontsLoaded, fontError] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  // Never block the app on a font failure: fall back to the system font.
  const ready = !isLoading && (fontsLoaded || !!fontError);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const modal = (title: string) => ({ presentation: 'modal' as const, headerShown: true, title });

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!!session}>
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
