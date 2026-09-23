import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useProfile, useUpdateProfile } from '@/features/profile/api';

import { useAppearance, type ThemePreference } from '../appearance-provider';

const OPTIONS: { value: ThemePreference; emoji: string }[] = [
  { value: 'light', emoji: '☀️' },
  { value: 'dark', emoji: '🌙' },
  { value: 'system', emoji: '📱' },
];

/** Segmented control: light (default) / dark / follow the system. */
export function AppearancePicker() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { preference, setPreference } = useAppearance();

  return (
    <View style={styles.container}>
      <ThemedText type="heading">{t('appearance.title')}</ThemedText>
      <View style={[styles.segmented, { backgroundColor: theme.backgroundSelected }]}>
        {OPTIONS.map((option) => {
          const selected = preference === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => setPreference(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.option, selected && { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.emoji}>{option.emoji}</ThemedText>
              <ThemedText type="smallBold" style={{ color: selected ? theme.text : theme.textSecondary }}>
                {t(`appearance.${option.value}`)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  segmented: { flexDirection: 'row', borderRadius: Radius.md, padding: 4, gap: 4 },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.sm,
    gap: 2,
  },
  emoji: { fontSize: 22, lineHeight: 28 },
});

const LANGUAGES = [
  { value: 'es', emoji: '🇪🇸' },
  { value: 'en', emoji: '🇬🇧' },
] as const;

/** Language lives on the profile, so it follows the user across devices. */
export function LanguagePicker() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const current = profile?.locale ?? i18n.language.split('-')[0];

  return (
    <View style={styles.container}>
      <ThemedText type="heading">{t('language.title')}</ThemedText>
      <View style={[styles.segmented, { backgroundColor: theme.backgroundSelected }]}>
        {LANGUAGES.map((option) => {
          const selected = current === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => update.mutate({ locale: option.value })}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.option, selected && { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={styles.emoji}>{option.emoji}</ThemedText>
              <ThemedText type="smallBold" style={{ color: selected ? theme.text : theme.textSecondary }}>
                {t(`language.${option.value}`)}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
