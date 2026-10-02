import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useHabits } from '@/features/habits/api';
import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';

import { FREE_HABIT_LIMIT, PRO_LIMITS_ENABLED } from '../limits';
import { usePro } from '../use-pro';

/** True when Free's habit limit blocks a new personal habit (never while the limits are off). */
export function useHabitLimitReached() {
  const { data: habits } = useHabits();
  const { isPro, isLoading } = usePro();
  if (!PRO_LIMITS_ENABLED || isPro || isLoading) return false;
  return (habits ?? []).filter((h) => !h.circle_habit_id).length >= FREE_HABIT_LIMIT;
}

/** Shown instead of the habit form at the limit: a gentle reason, then the way to Pro. */
export function HabitLimit() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.lavenderSoft }]}>
      <Brote mood="cheer" size={88} />
      <ThemedText type="subtitle" style={styles.center}>
        {t('paywall.habitLimit.title', { count: FREE_HABIT_LIMIT })}
      </ThemedText>
      <ThemedText themeColor="textSecondary" style={styles.center}>
        {t('paywall.habitLimit.body')}
      </ThemedText>
      <Button
        label={t('paywall.habitLimit.cta')}
        onPress={() => router.replace({ pathname: '/paywall', params: { source: 'habit_limit' } })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { margin: Spacing.three, padding: Spacing.four, gap: Spacing.three, borderRadius: Radius.xl, alignItems: 'center' },
  center: { textAlign: 'center' },
});
