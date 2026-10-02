import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { HabitColors, Spacing } from '@/constants/theme';
import { useSession } from '@/features/auth/session-provider';
import { Brote } from '@/features/mascot/brote';
import { useProfile } from '@/features/profile/api';
import { registerPushToken } from '@/features/push/push-token';
import { ensureNotificationPermission } from '@/features/reminders/notifications';
import { useTheme } from '@/hooks/use-theme';

import { SocialError, useCreateSocialProfile } from '../api';
import { isValidUsername, normalizeUsername, suggestUsername } from '../username';
import { SocialCard } from './social-card';

/** First visit to Friends: say what friends will (and will not) see, then pick a name and a color. */
export function UsernameSetup() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: profile } = useProfile();
  const { session } = useSession();
  const create = useCreateSocialProfile();
  const initialName = profile?.display_name ?? '';
  const [displayName, setDisplayName] = useState(initialName);
  const [username, setUsername] = useState(() => suggestUsername(initialName));
  const [color, setColor] = useState<string>(HabitColors[0]);

  const valid = isValidUsername(username) && displayName.trim().length > 0;
  const errorCode = create.error instanceof SocialError ? create.error.code : create.error ? 'generic' : null;

  return (
    <SocialCard style={styles.card}>
      <Brote mood="cheer" size={80} />
      <ThemedText type="heading" style={styles.center}>
        {t('social.setup.title')}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {t('social.setup.body')}
      </ThemedText>
      <View style={styles.form}>
        <TextField label={t('social.setup.name')} value={displayName} onChangeText={setDisplayName} maxLength={30} />
        <TextField
          label={t('social.setup.username')}
          hint={t('social.setup.usernameHint')}
          value={username}
          onChangeText={(text) => setUsername(normalizeUsername(text))}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          error={errorCode === 'taken' ? t('social.errors.taken') : null}
        />
        <ThemedText type="smallBold">{t('social.setup.color')}</ThemedText>
        <View style={styles.colors}>
          {HabitColors.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              accessibilityRole="radio"
              accessibilityState={{ selected: color === c }}
              style={[styles.swatch, { backgroundColor: c, borderColor: theme.text, borderWidth: color === c ? 3 : 0 }]}
            />
          ))}
        </View>
        {errorCode && errorCode !== 'taken' && (
          <ThemedText type="small" themeColor="danger">
            {t(`social.errors.${errorCode}`)}
          </ThemedText>
        )}
        <Button
          label={t('social.setup.submit')}
          disabled={!valid}
          loading={create.isPending}
          onPress={() =>
            create.mutate(
              { username, display_name: displayName.trim(), color },
              // Joining the social side is when pushes make sense: ask now, with the reason fresh.
              { onSuccess: async () => session && (await ensureNotificationPermission()) && registerPushToken(session.user.id) },
            )
          }
        />
      </View>
    </SocialCard>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center' },
  center: { textAlign: 'center' },
  form: { alignSelf: 'stretch', gap: Spacing.three },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  swatch: { width: 36, height: 36, borderRadius: 18 },
});
