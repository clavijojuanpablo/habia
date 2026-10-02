import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useProfile, useUpdateProfile } from '@/features/profile/api';
import { ensureNotificationPermission } from '@/features/reminders/notifications';
import { useTheme } from '@/hooks/use-theme';

import { registerPushToken } from '../push-token';

/** Cheers, friend requests and circle nudges as pushes: on by default, one switch away from off. */
export function SocialPushToggle() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const enabled = profile?.social_push ?? true;

  const onChange = async (value: boolean) => {
    update.mutate({ social_push: value });
    // Turning it on is the moment to ask for notifications, with the reason right on screen.
    if (value && (await ensureNotificationPermission())) await registerPushToken();
  };

  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <ThemedText type="heading">{t('push.social')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('push.socialHint')}
        </ThemedText>
      </View>
      <Switch
        value={enabled}
        onValueChange={onChange}
        trackColor={{ true: theme.primary, false: theme.border }}
        accessibilityLabel={t('push.social')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  texts: { flex: 1, gap: Spacing.one },
});
