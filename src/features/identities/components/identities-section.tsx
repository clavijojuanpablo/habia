import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useHabits } from '@/features/habits/api';
import { useTheme } from '@/hooks/use-theme';

import { identityEmoji, useIdentities } from '../api';

/** "Who do you want to become?": identities become the branches of the tree. */
export function IdentitiesSection() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: identities = [] } = useIdentities();
  const { data: habits = [] } = useHabits();

  return (
    <View style={styles.container}>
      <ThemedText type="heading">{t('identity.title')}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {t('identity.sectionHint')}
      </ThemedText>

      {identities.map((identity) => {
        const count = habits.filter((h) => h.identity_id === identity.id).length;
        return (
          <Pressable
            key={identity.id}
            onPress={() => router.push({ pathname: '/identity/[id]', params: { id: identity.id } })}
            style={[styles.row, { backgroundColor: theme.background, borderLeftColor: identity.color ?? theme.primary }]}>
            <ThemedText style={styles.emoji}>{identityEmoji(identity)}</ThemedText>
            <View style={styles.flex}>
              <ThemedText type="smallBold">{identity.statement}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {t('identity.habitCount', { count })}
              </ThemedText>
            </View>
          </Pressable>
        );
      })}

      <Button label={`+ ${t('identity.new')}`} variant="secondary" onPress={() => router.push('/identity/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderLeftWidth: 4,
  },
  emoji: { fontSize: 24, lineHeight: 30 },
  flex: { flex: 1 },
});
