import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';
import { parseLocalDate } from '@/lib/recurrence';

import type { WeeklyReview } from '../weekly-review-api';

function Card({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, boxShadow: Shadow.card }]}>{children}</View>
  );
}

/** Brote's review of last week: what was planted, what it noticed, one small step for this week. */
export function WeeklyReviewCard({ review, onDone }: { review: WeeklyReview; onDone: () => void }) {
  const { t, i18n } = useTranslation();
  const { title, win, pattern, suggestion, summary } = review.content;
  // The reviewed week by name: opened on a Thursday, "your week" alone reads like the current one.
  const day = (date: string) => parseLocalDate(date).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });
  return (
    <Card>
      <View style={styles.row}>
        <Brote mood="celebrate" size={48} />
        <View style={styles.flex}>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('weeklyReview.label', { from: day(summary.weekStart), to: day(summary.weekEnd) })}
          </ThemedText>
          <ThemedText type="heading">{title}</ThemedText>
        </View>
      </View>
      <Section emoji="🌱" label={t('weeklyReview.win')} text={win} />
      <Section emoji="🔍" label={t('weeklyReview.pattern')} text={pattern} />
      <Section emoji="💧" label={t('weeklyReview.suggestion')} text={suggestion} />
      <Button label={t('weeklyReview.done')} variant="secondary" onPress={onDone} />
    </Card>
  );
}

function Section({ emoji, label, text }: { emoji: string; label: string; text: string }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">
        {emoji} {label}
      </ThemedText>
      <ThemedText type="small">{text}</ThemedText>
    </View>
  );
}

/** Shown for the few seconds the server takes to write the review. */
export function WeeklyReviewWriting() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Card>
      <View style={styles.row}>
        <Brote mood="happy" size={40} />
        <ThemedText type="small" style={styles.flex}>
          {t('weeklyReview.writing')}
        </ThemedText>
        <ActivityIndicator color={theme.primary} />
      </View>
    </Card>
  );
}

/**
 * The one-time opt-in (App Store 5.1.2: explicit permission before sharing personal data with a
 * third-party AI). Short on purpose: the essentials here, the full detail (provider, every field)
 * one tap away in the privacy policy.
 */
export function WeeklyReviewOffer({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Card>
      <View style={styles.row}>
        <Brote mood="cheer" size={48} />
        <ThemedText type="smallBold" style={styles.flex}>
          {t('weeklyReview.offerTitle')}
        </ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary">
        {t('weeklyReview.offerBody')}{' '}
        <ThemedText
          type="small"
          style={{ color: theme.primary }}
          onPress={() => router.push('/legal/privacy')}
          accessibilityRole="link">
          {t('weeklyReview.details')}
        </ThemedText>
      </ThemedText>
      <View style={styles.actions}>
        <Button label={t('weeklyReview.accept')} onPress={onAccept} style={styles.flex} />
        <Pressable onPress={onDecline} hitSlop={8} accessibilityRole="button">
          <ThemedText type="small" style={{ color: theme.primary }}>
            {t('weeklyReview.decline')}
          </ThemedText>
        </Pressable>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Radius.lg, gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
  section: { gap: Spacing.one },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
});
