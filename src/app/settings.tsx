import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import * as Application from 'expo-application';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_RELEASE } from '@/constants/release';
import { FontFamily, MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { AppearancePicker, LanguagePicker } from '@/features/appearance/components/appearance-picker';
import { AiReviewToggle } from '@/features/coach/components/ai-review-toggle';
import { useWeeklyReviewAvailable } from '@/features/coach/weekly-review-api';
import { signOut } from '@/features/auth/api';
import { DangerZone } from '@/features/auth/components/danger-zone';
import { useSession } from '@/features/auth/session-provider';
import { AnalyticsToggle } from '@/features/profile/components/analytics-toggle';
import { SocialPushToggle } from '@/features/push/components/social-push-toggle';
import { useProfile } from '@/features/profile/api';
import { DayBandsEditor } from '@/features/profile/components/day-bands-editor';
import { ProRow } from '@/features/paywall/components/pro-row';
import { useTheme } from '@/hooks/use-theme';

/** Account and app settings (the old Profile tab): opened from the gear on Friends. */
export default function SettingsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { session } = useSession();
  const { data: profile } = useProfile();
  const { data: aiReviewAvailable } = useWeeklyReviewAvailable();
  const name = profile?.display_name ?? t('profile.title');

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.header, { backgroundColor: theme.lavenderSoft }]}>
          <View style={[styles.avatar, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={styles.avatarText}>{name.charAt(0).toUpperCase()}</ThemedText>
          </View>
          <View style={styles.flex}>
            <ThemedText type="subtitle" numberOfLines={1}>
              {name}
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {session?.user.email}
            </ThemedText>
            {profile?.timezone && (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {t('profile.timezone', { zone: profile.timezone })}
              </ThemedText>
            )}
          </View>
        </View>

        <ProRow />

        <Card>
          <AppearancePicker />
          <Divider />
          <LanguagePicker />
        </Card>
        {profile && (
          <Card>
            <DayBandsEditor profile={profile} />
          </Card>
        )}

        <Card>
          <SocialPushToggle />
          <Divider />
          <AnalyticsToggle />
          {/* Whoever turned it on can always turn it off, even while the service is unavailable. */}
          {(aiReviewAvailable || profile?.ai_coach_enabled) && (
            <>
              <Divider />
              <AiReviewToggle />
            </>
          )}
        </Card>

        <Button label={t('auth.signOut')} variant="secondary" onPress={() => signOut()} />

        <DangerZone />

        {/* Legal texts: always reachable, never in the way. */}
        <View style={styles.legal}>
          <Pressable accessibilityRole="link" hitSlop={12} onPress={() => router.push('/legal/privacy')}>
            <ThemedText type="link">{t('legal.privacy')}</ThemedText>
          </Pressable>
          <ThemedText type="small" themeColor="textSecondary">
            ·
          </ThemedText>
          <Pressable accessibilityRole="link" hitSlop={12} onPress={() => router.push('/legal/terms')}>
            <ThemedText type="link">{t('legal.terms')}</ThemedText>
          </Pressable>
        </View>
        <AppVersion />
      </ScrollView>
    </ThemedView>
  );
}

// Which binary and which OTA update is running: the only way to tell on a phone that an update arrived.
function AppVersion() {
  const { t } = useTranslation();
  const build = Application.nativeBuildVersion;
  if (!build) return null;

  const update = !Updates.updateId
    ? t('profile.updateDev')
    : Updates.isEmbeddedLaunch
      ? t('profile.updateEmbedded')
      : Updates.updateId.slice(0, 8);
  return (
    <ThemedText type="small" themeColor="textSecondary" style={styles.version}>
      {t('profile.version', { version: APP_RELEASE, build, update })}
    </ThemedText>
  );
}

function Divider() {
  const theme = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

function Card({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>{children}</View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    borderRadius: Radius.xl,
  },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 28, lineHeight: 34, fontFamily: FontFamily.black },
  version: { textAlign: 'center' },
  legal: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: Spacing.two },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.one },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three, boxShadow: Shadow.card },
});
