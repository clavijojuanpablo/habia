import { useTranslation } from 'react-i18next';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { useProfile, useUpdateProfile } from '@/features/profile/api';

import { useAppearance } from '../appearance-provider';

/**
 * A settings row: label on the left, two small options on the right. Choosing is enough, so no
 * "system" option (a profile still set to it keeps following the phone; the active mode shows).
 */
function InlineChoice<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: { value: T; text: string; label?: string }[];
  selected: T;
  onSelect: (value: T) => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <ThemedText type="smallBold" style={styles.flex}>
        {label}
      </ThemedText>
      <View style={[styles.segmented, { backgroundColor: theme.backgroundSelected }]} accessibilityRole="radiogroup">
        {options.map((option) => {
          const active = selected === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onSelect(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={option.label ?? option.text}
              style={[styles.option, active && { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={[styles.icon, !active && styles.faded]}>{option.text}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function AppearancePicker() {
  const { t } = useTranslation();
  const { mode, setPreference } = useAppearance();
  return (
    <InlineChoice
      label={t('appearance.title')}
      options={[
        { value: 'light', text: '☀️', label: t('appearance.light') },
        { value: 'dark', text: '🌙', label: t('appearance.dark') },
      ]}
      selected={mode}
      onSelect={setPreference}
    />
  );
}

/** Language lives on the profile, so it follows the user across devices. */
export function LanguagePicker() {
  const { t, i18n } = useTranslation();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const current = (profile?.locale ?? i18n.language.split('-')[0]) === 'en' ? 'en' : 'es';
  return (
    <InlineChoice
      label={t('language.title')}
      options={[
        { value: 'es', text: Platform.OS === 'web' ? t('language.esShort') : '🇪🇸', label: t('language.es') },
        { value: 'en', text: Platform.OS === 'web' ? t('language.enShort') : '🇬🇧', label: t('language.en') },
      ]}
      selected={current}
      onSelect={(locale) => update.mutate({ locale })}
    />
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
  segmented: { flexDirection: 'row', borderRadius: Radius.md, padding: 3, gap: 3 },
  option: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.three, borderRadius: Radius.sm },
  icon: { fontSize: 20, lineHeight: 26 },
  faded: { opacity: 0.45 },
});
