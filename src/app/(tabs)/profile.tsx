import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session-provider';
import { IdentitiesSection } from '@/features/identities/components/identities-section';
import { useProfile } from '@/features/profile/api';
import { DayBandsEditor } from '@/features/profile/components/day-bands-editor';
import { supabase } from '@/lib/supabase/client';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { session } = useSession();
  const { data: profile } = useProfile();

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">{profile?.display_name ?? t('profile.title')}</ThemedText>
          <ThemedText themeColor="textSecondary">{session?.user.email}</ThemedText>

          <IdentitiesSection />

          {profile && <DayBandsEditor profile={profile} />}

          <Button label={t('auth.signOut')} variant="secondary" onPress={() => supabase.auth.signOut()} />
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
