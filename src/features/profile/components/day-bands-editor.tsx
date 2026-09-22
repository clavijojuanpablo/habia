import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Stepper } from '@/components/stepper';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useBandColors } from '@/hooks/use-theme';
import type { Tables } from '@/lib/supabase/client';

import { useUpdateProfile } from '../api';

type Props = { profile: Tables<'profiles'> };

const hourLabel = (hour: number) => `${String(hour % 24).padStart(2, '0')}:00`;

/** Four steppers bounded by each other so the bands always stay ordered. */
export function DayBandsEditor({ profile }: Props) {
  const { t } = useTranslation();
  const bandColors = useBandColors();
  const update = useUpdateProfile();
  const {
    morning_starts_at: morning,
    afternoon_starts_at: afternoon,
    night_starts_at: night,
    night_ends_at: nightEnd,
  } = profile;

  const rows = [
    { key: 'morningStart', band: 'morning', label: t('profile.morningStartsAt', { time: hourLabel(morning) }), value: morning, min: 0, max: afternoon - 1, field: 'morning_starts_at' },
    { key: 'afternoonStart', band: 'afternoon', label: t('profile.afternoonStartsAt', { time: hourLabel(afternoon) }), value: afternoon, min: morning + 1, max: night - 1, field: 'afternoon_starts_at' },
    { key: 'nightStart', band: 'night', label: t('profile.nightStartsAt', { time: hourLabel(night) }), value: night, min: afternoon + 1, max: nightEnd - 1, field: 'night_starts_at' },
    { key: 'nightEnd', band: 'night', label: t('profile.nightEndsAt', { time: hourLabel(nightEnd) }), value: nightEnd, min: night + 1, max: 24, field: 'night_ends_at' },
  ] as const;

  return (
    <View style={styles.container}>
      <ThemedText type="heading">{t('profile.dayBands')}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {t('profile.dayBandsHint')}
      </ThemedText>
      {rows.map((row) => (
        <View key={row.key} style={[styles.row, { backgroundColor: bandColors[row.band].background }]}>
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
