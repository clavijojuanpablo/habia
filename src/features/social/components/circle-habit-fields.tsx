import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { toRRule, WEEKDAYS, type Weekday } from '@/lib/recurrence';

export type CircleHabitDraft = {
  name: string;
  minimum: string;
  daily: boolean;
  days: Weekday[];
  withPhoto: boolean;
};

export const EMPTY_CIRCLE_HABIT: CircleHabitDraft = {
  name: '',
  minimum: '',
  daily: true,
  days: ['MO', 'WE', 'FR'],
  withPhoto: false,
};

export const circleHabitValid = (d: CircleHabitDraft) => d.name.trim().length > 0 && (d.daily || d.days.length > 0);

/** What start_circle_habit needs from a draft. */
export const circleHabitInput = (d: CircleHabitDraft) => ({
  name: d.name.trim(),
  rrule: toRRule(d.daily ? { kind: 'daily' } : { kind: 'weekdays', days: d.days }),
  minimum: d.minimum.trim(),
  withPhoto: d.withPhoto,
});

/**
 * The habit a circle does together: what, its 2-minute version, which days (daily or fixed
 * weekdays, so the group stays in step) and whether a check-in needs a photo. No icon: the
 * circle's is the habit's.
 */
export function CircleHabitFields({
  value,
  onChange,
}: {
  value: CircleHabitDraft;
  onChange: (value: CircleHabitDraft) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const set = (patch: Partial<CircleHabitDraft>) => onChange({ ...value, ...patch });
  const chip = (selected: boolean) => [
    styles.chip,
    {
      backgroundColor: selected ? theme.primarySoft : theme.backgroundElement,
      borderColor: selected ? theme.primary : 'transparent',
    },
  ];

  return (
    <View style={styles.container}>
      <TextField
        label={t('social.circleHabit.name')}
        placeholder={t('social.circleHabit.namePlaceholder')}
        value={value.name}
        onChangeText={(name) => set({ name })}
        maxLength={80}
      />
      <TextField
        label={`${t('social.circleHabit.minimumLabel')} (${t('common.optional')})`}
        placeholder={t('social.circleHabit.minimumPlaceholder')}
        value={value.minimum}
        onChangeText={(minimum) => set({ minimum })}
        maxLength={120}
      />

      <ThemedText type="smallBold">{t('habit.frequency')}</ThemedText>
      <View style={styles.wrap}>
        {[true, false].map((d) => (
          <Pressable
            key={String(d)}
            onPress={() => set({ daily: d })}
            accessibilityRole="radio"
            accessibilityState={{ selected: value.daily === d }}
            style={chip(value.daily === d)}>
            <ThemedText type="smallBold">{t(d ? 'habit.freq.daily' : 'habit.freq.weekdays')}</ThemedText>
          </Pressable>
        ))}
      </View>
      {!value.daily && (
        <View style={styles.wrap}>
          {WEEKDAYS.map((d) => (
            <Pressable
              key={d}
              onPress={() => set({ days: value.days.includes(d) ? value.days.filter((x) => x !== d) : [...value.days, d] })}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: value.days.includes(d) }}
              style={[styles.day, ...chip(value.days.includes(d))]}>
              <ThemedText type="smallBold">{t(`weekdays.${d}`)}</ThemedText>
            </Pressable>
          ))}
        </View>
      )}

      <View style={[styles.photoRow, { backgroundColor: theme.backgroundElement }]}>
        <View style={styles.flex}>
          <ThemedText type="smallBold">📸 {t('social.circleHabit.withPhoto')}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('social.circleHabit.withPhotoHint')}
          </ThemedText>
        </View>
        <Switch
          value={value.withPhoto}
          onValueChange={(withPhoto) => set({ withPhoto })}
          trackColor={{ true: theme.primary, false: theme.border }}
          accessibilityLabel={t('social.circleHabit.withPhoto')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.three },
  flex: { flex: 1 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: { width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0 },
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
});
