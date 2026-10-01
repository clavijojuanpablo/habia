import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useProfile, useUpdateProfile } from '@/features/profile/api';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';

/** Opt-in switch for the AI weekly review (Profile shows it only while the server can write reviews). */
export function AiReviewToggle() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  if (!profile) return null;

  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <ThemedText type="heading">{t('weeklyReview.toggle')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('weeklyReview.toggleHint')}
        </ThemedText>
      </View>
      <Switch
        value={profile.ai_coach_enabled}
        onValueChange={(value) => {
          track(value ? 'ai_review_enabled' : 'ai_review_disabled');
          update.mutate({ ai_coach_enabled: value });
        }}
        trackColor={{ true: theme.primary, false: theme.border }}
        accessibilityLabel={t('weeklyReview.toggle')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  texts: { flex: 1, gap: Spacing.one },
});
