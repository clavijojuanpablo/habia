import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Stepper } from '@/components/stepper';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useBandColors } from '@/hooks/use-theme';
import type { Tables } from '@/lib/supabase/client';

import { useUpdateProfile } from '../api';

type Props = { profile: Tables<'profiles'> };

/** Three steppers bounded by each other so the bands always stay ordered. */
export function DayBandsEditor({ profile }: Props) {
  const { t } = useTranslation();
  const bandColors = useBandColors();
  const update = useUpdateProfile();
  const { morning_starts_at: morning, afternoon_starts_at: afternoon, night_starts_at: night } = profile;

  const rows = [
    { key: 'morning', label: t('profile.morningStartsAt', { hour: morning }), value: morning, min: 0, max: afternoon - 1, field: 'morning_starts_at' },
    { key: 'afternoon', label: t('profile.afternoonStartsAt', { hour: afternoon }), value: afternoon, min: morning + 1, max: night - 1, field: 'afternoon_starts_at' },
    { key: 'night', label: t('profile.nightStartsAt', { hour: night }), value: night, min: afternoon + 1, max: 23, field: 'night_starts_at' },
  ] as const;

  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">{t('profile.dayBands')}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {t('profile.dayBandsHint')}
      </ThemedText>
      {rows.map((row) => (
        <View key={row.key} style={[styles.row, { backgroundColor: bandColors[row.key].background }]}>
          <Stepper
            label={row.label}
            value={row.value}
            min={row.min}
            max={row.max}
            onChange={(value) => update.mutate({ [row.field]: value })}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  row: { borderRadius: Spacing.three, padding: Spacing.two },
});
