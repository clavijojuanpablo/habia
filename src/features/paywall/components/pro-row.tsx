import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { usePro } from '../use-pro';

/** Settings' way into habia Pro: plans and restore, or managing the subscription once Pro. */
export function ProRow() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { isPro } = usePro();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/paywall', params: { source: 'settings' } })}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.row,
        { backgroundColor: theme.goldSoft, borderColor: theme.gold, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <ThemedText style={styles.icon}>{isPro ? '💚' : '✨'}</ThemedText>
      <View style={styles.flex}>
        <ThemedText type="heading">{t('paywall.settingsRow')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {isPro ? t('paywall.settingsHintPro') : t('paywall.settingsHint')}
        </ThemedText>
      </View>
      <ThemedText type="smallBold" style={[styles.pill, { backgroundColor: theme.gold, color: theme.onGold }]}>
        {isPro ? t('paywall.manageShort') : t('paywall.seePlans')}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 2,
    boxShadow: Shadow.card,
  },
  icon: { fontSize: 32, lineHeight: 38 },
  pill: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: Radius.pill, overflow: 'hidden' },
});
