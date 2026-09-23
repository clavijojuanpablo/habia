import { createContext, use, useEffect, type PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';

import { useProfile, useUpdateProfile } from '@/features/profile/api';
import { useColorScheme } from '@/hooks/use-color-scheme';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ColorMode = 'light' | 'dark';

type Appearance = {
  preference: ThemePreference;
  /** The mode actually applied after resolving "system". */
  mode: ColorMode;
  setPreference: (preference: ThemePreference) => void;
};

export const AppearanceContext = createContext<Appearance>({
  preference: 'light',
  mode: 'light',
  setPreference: () => {},
});

/**
 * Resolves the user's appearance: stored on their profile (synced across devices),
 * light by default and before sign-in, or following the OS when set to "system".
 */
export function AppearanceProvider({ children }: PropsWithChildren) {
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const systemScheme = useColorScheme();
  const { i18n } = useTranslation();

  // Saving the locale on the profile is not enough: i18next has to switch too.
  const locale = profile?.locale;
  useEffect(() => {
    if (locale && i18n.language !== locale) i18n.changeLanguage(locale);
  }, [locale, i18n]);

  const preference = (profile?.theme_preference as ThemePreference | undefined) ?? 'light';
  const mode: ColorMode = preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

  return (
    <AppearanceContext
      value={{ preference, mode, setPreference: (theme_preference) => update.mutate({ theme_preference }) }}>
      {children}
    </AppearanceContext>
  );
}

export function useAppearance() {
  return use(AppearanceContext);
}
