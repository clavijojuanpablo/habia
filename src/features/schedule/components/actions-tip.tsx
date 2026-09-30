import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';
import { storage } from '@/lib/storage';

const SEEN_KEY = 'habia.tip.habitActions';

export function hasSeenActionsTip() {
  return storage.getItem(SEEN_KEY) === '1';
}

export function markActionsTipSeen() {
  storage.setItem(SEEN_KEY, '1');
}

/**
 * One-time hint, told by Brote, that a habit hides more than the check: the
 * 2-minute version and a rest day. The screen decides when it is shown.
 */
export function ActionsTip({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, boxShadow: Shadow.card }]}>
      <Brote mood="cheer" size={56} />
      <ThemedText type="small" style={styles.text}>
        {t('today.actions.tip')}
      </ThemedText>
      <Pressable onPress={onDismiss} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.close')}>
        <ThemedText type="heading" themeColor="textSecondary">
          ×
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
  },
  text: { flex: 1 },
});
