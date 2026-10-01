import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { parseLocalDate } from '@/lib/recurrence';

import { useWeeklyReviews } from '../weekly-review-api';
import { WeeklyReviewCard } from './weekly-review-card';

/** Brote's reviews on Progress: the latest in full, earlier weeks one tap away. */
export function WeeklyReviewHistory() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const { data: reviews = [] } = useWeeklyReviews();
  const [openId, setOpenId] = useState<string | null>(null);
  if (reviews.length === 0) return null;

  const [latest, ...earlier] = reviews;
  const week = (start: string) =>
    t('progress.reviewWeek', {
      date: parseLocalDate(start).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short' }),
    });

  return (
    <View style={styles.section}>
      <ThemedText type="heading">{t('progress.reviewsTitle')}</ThemedText>
      <WeeklyReviewCard review={latest} teaser />
      {earlier.length > 0 && (
        <View style={[styles.list, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {t('progress.reviewsEarlier')}
          </ThemedText>
          {earlier.map((review) => {
            const open = openId === review.id;
            return (
              <View key={review.id} style={styles.item}>
                <Pressable
                  onPress={() => setOpenId(open ? null : review.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  style={styles.row}>
                  <View style={styles.flex}>
                    <ThemedText type="caption" themeColor="textSecondary">
                      {week(review.period_start)}
                    </ThemedText>
                    <ThemedText type="smallBold">{review.content.title}</ThemedText>
                  </View>
                  <ThemedText type="heading" themeColor="textSecondary">
                    {open ? '▾' : '▸'}
                  </ThemedText>
                </Pressable>
                {open && <WeeklyReviewCard review={review} />}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  list: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two, boxShadow: Shadow.card },
  item: { gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});
