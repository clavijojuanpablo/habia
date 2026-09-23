import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { FontFamily, MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { AppearancePicker, LanguagePicker } from '@/features/appearance/components/appearance-picker';
import { DangerZone } from '@/features/auth/components/danger-zone';
import { useSession } from '@/features/auth/session-provider';
import { IdentitiesSection } from '@/features/identities/components/identities-section';
import { useProfile } from '@/features/profile/api';
import { DayBandsEditor } from '@/features/profile/components/day-bands-editor';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase/client';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { session } = useSession();
  const { data: profile } = useProfile();
  const name = profile?.display_name ?? t('profile.title');

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
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
            </View>
          </View>

          <Card>
            <AppearancePicker />
          </Card>
          <Card>
            <LanguagePicker />
          </Card>
          <Card>
            <IdentitiesSection />
          </Card>
          {profile && (
            <Card>
              <DayBandsEditor profile={profile} />
            </Card>
          )}

          <Button label={t('auth.signOut')} variant="secondary" onPress={() => supabase.auth.signOut()} />

          <DangerZone />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
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
  card: { borderRadius: Radius.lg, padding: Spacing.three, boxShadow: Shadow.card },
});
