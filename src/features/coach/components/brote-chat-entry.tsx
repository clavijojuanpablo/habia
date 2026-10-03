import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';

/** The Garden's door to the chat: Brote, one line, one tap. */
export function BroteChatEntry() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/brote')}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.lavenderSoft, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <Brote mood="happy" size={52} animated={false} />
      <View style={styles.flex}>
        <ThemedText type="heading">💬 {t('chat.entryTitle')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('chat.entryHint')}
        </ThemedText>
      </View>
      <ThemedText type="heading" themeColor="textSecondary">
        ›
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    boxShadow: Shadow.card,
  },
});
