import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { SocialError, useCreateCircleHabit } from '@/features/social/api';
import { useTheme } from '@/hooks/use-theme';
import { toRRule, WEEKDAYS, type Weekday } from '@/lib/recurrence';

const ICONS = ['🚶', '🏃', '📚', '🧘', '💧', '🥗', '😴', '💪', '✍️', '📵'];

/** The circle owner defines one habit for everyone: daily or on fixed weekdays, so the group stays in step. */
export default function NewCircleHabitScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const create = useCreateCircleHabit();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [minimum, setMinimum] = useState('');
  const [daily, setDaily] = useState(true);
  const [days, setDays] = useState<Weekday[]>(['MO', 'WE', 'FR']);

  const valid = name.trim().length > 0 && (daily || days.length > 0);
  const errorCode = create.error instanceof SocialError ? create.error.code : create.error ? 'generic' : null;
  const chip = (selected: boolean) => [
    styles.chip,
    {
      backgroundColor: selected ? theme.primarySoft : theme.backgroundElement,
      borderColor: selected ? theme.primary : 'transparent',
    },
  ];

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="small" themeColor="textSecondary">
          {t('social.circleHabit.newHint')}
        </ThemedText>
        <TextField
          label={t('social.circleHabit.name')}
          placeholder={t('social.circleHabit.namePlaceholder')}
          value={name}
          onChangeText={setName}
          maxLength={80}
        />
        <View style={styles.wrap}>
          {ICONS.map((e) => (
            <Pressable
              key={e}
              onPress={() => setIcon(e)}
              accessibilityRole="radio"
              accessibilityState={{ selected: icon === e }}
              style={[styles.iconTile, ...chip(icon === e)]}>
              <ThemedText style={styles.iconText}>{e}</ThemedText>
            </Pressable>
          ))}
        </View>
        <TextField
          label={`${t('social.circleHabit.minimumLabel')} (${t('common.optional')})`}
          placeholder={t('social.circleHabit.minimumPlaceholder')}
          value={minimum}
          onChangeText={setMinimum}
          maxLength={120}
        />

        <ThemedText type="smallBold">{t('habit.frequency')}</ThemedText>
        <View style={styles.wrap}>
          {[true, false].map((d) => (
            <Pressable key={String(d)} onPress={() => setDaily(d)} accessibilityRole="radio" style={chip(daily === d)}>
              <ThemedText type="smallBold">{t(d ? 'habit.freq.daily' : 'habit.freq.weekdays')}</ThemedText>
            </Pressable>
          ))}
        </View>
        {!daily && (
          <View style={styles.wrap}>
            {WEEKDAYS.map((d) => (
              <Pressable
                key={d}
                onPress={() => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: days.includes(d) }}
                style={[styles.day, ...chip(days.includes(d))]}>
                <ThemedText type="smallBold">{t(`weekdays.${d}`)}</ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        {errorCode && (
          <ThemedText type="small" themeColor="danger">
            {t(`social.errors.${errorCode}`)}
          </ThemedText>
        )}
        <Button
          label={t('social.circleHabit.create')}
          disabled={!valid}
          loading={create.isPending}
          onPress={() =>
            create.mutate(
              {
                circle_id: circleId,
                name: name.trim(),
                icon,
                two_minute_version: minimum.trim() || null,
                rrule: toRRule(daily ? { kind: 'daily' } : { kind: 'weekdays', days }),
              },
              { onSuccess: () => router.back() },
            )
          }
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTile: { width: 52, height: 52, paddingHorizontal: 0, paddingVertical: 0, borderRadius: Radius.md },
  iconText: { fontSize: 26, lineHeight: 32 },
  day: { width: 44, height: 44, paddingHorizontal: 0, paddingVertical: 0 },
});
