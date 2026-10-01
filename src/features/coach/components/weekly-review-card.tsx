import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing, type ThemeColor } from '@/constants/theme';
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

/**
 * Brote's review of last week, the most personal thing in the app, so it looks the part: a green
 * frame, a tinted header that says it was written from the user's own week, and three colored
 * sections (what was planted, what Brote noticed, one small step). `teaser` starts it folded
 * (Progress) with an invitation to read it; on Today it opens in full with a thank-you.
 */
export function WeeklyReviewCard({
  review,
  onDone,
  teaser = false,
}: {
  review: WeeklyReview;
  onDone?: () => void;
  teaser?: boolean;
}) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(!teaser);
  const { title, win, pattern, suggestion, summary } = review.content;
  // The reviewed week by name: opened on a Thursday, "your week" alone reads like the current one.
  const day = (date: string) => parseLocalDate(date).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' });

  return (
    <View
      style={[
        styles.reviewCard,
        { backgroundColor: theme.backgroundElement, borderColor: theme.primary, boxShadow: Shadow.card },
      ]}>
      <Pressable
        disabled={!teaser}
        onPress={() => setOpen(!open)}
        accessibilityRole={teaser ? 'button' : undefined}
        accessibilityState={teaser ? { expanded: open } : undefined}
        style={[styles.reviewHeader, { backgroundColor: theme.primarySoft }]}>
        <Brote mood="celebrate" size={52} />
        <View style={styles.flex}>
          <View style={[styles.pill, { backgroundColor: theme.primary }]}>
            <ThemedText type="caption" style={{ color: theme.onPrimary }}>
              {t('weeklyReview.badge')}
            </ThemedText>
          </View>
          <ThemedText type="heading">{title}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('weeklyReview.label', { from: day(summary.weekStart), to: day(summary.weekEnd) })}
          </ThemedText>
        </View>
      </Pressable>

      {open ? (
        <View style={styles.reviewBody}>
          <Section emoji="🌱" tint="primarySoft" label={t('weeklyReview.win')} text={win} />
          <Section emoji="🔍" tint="lavenderSoft" label={t('weeklyReview.pattern')} text={pattern} />
          <Section emoji="💧" tint="streakSoft" label={t('weeklyReview.suggestion')} text={suggestion} />
          {onDone && <Button label={t('weeklyReview.done')} onPress={onDone} />}
        </View>
      ) : (
        <Pressable onPress={() => setOpen(true)} accessibilityRole="button" style={styles.reviewBody}>
          <ThemedText type="small" numberOfLines={2}>
            🌱 {win}
          </ThemedText>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            {t('weeklyReview.readMore')} ›
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
}

function Section({ emoji, tint, label, text }: { emoji: string; tint: ThemeColor; label: string; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <View style={[styles.sectionBadge, { backgroundColor: theme[tint] }]}>
        <ThemedText style={styles.sectionEmoji}>{emoji}</ThemedText>
      </View>
      <View style={styles.flex}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small">{text}</ThemedText>
      </View>
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
  section: { flexDirection: 'row', gap: Spacing.three },
  sectionBadge: { width: 36, height: 36, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  sectionEmoji: { fontSize: 18, lineHeight: 24 },
  reviewCard: { borderRadius: Radius.lg, borderWidth: 2, overflow: 'hidden' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, padding: Spacing.three },
  reviewBody: { padding: Spacing.three, gap: Spacing.three },
  pill: { alignSelf: 'flex-start', paddingHorizontal: Spacing.two, paddingVertical: Spacing.half, borderRadius: Radius.pill },
  actions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.four },
});
