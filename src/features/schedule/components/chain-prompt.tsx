import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import type { ScheduledItem } from '../build-schedule';

const AUTO_DISMISS_MS = 12_000;

type Props = {
  item: ScheduledItem;
  onDone: () => void;
  onDismiss: () => void;
};

/**
 * Habit stacking in action: right after the anchor is checked, the next habit in
 * the chain is surfaced while the cue is still fresh.
 */
export function ChainPrompt({ item, onDone, onDismiss }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [item.key, onDismiss]);

  return (
    <Animated.View
      entering={FadeInDown.springify()}
      exiting={FadeOutDown}
      style={[styles.card, { backgroundColor: theme.text }]}
      accessibilityLiveRegion="polite">
      <View style={styles.texts}>
        <ThemedText type="small" style={{ color: theme.background, opacity: 0.8 }}>
          {t('today.nextInChain')}
        </ThemedText>
        <ThemedText type="smallBold" style={{ color: theme.background }} numberOfLines={1}>
          {item.habit.icon} {item.habit.name}
        </ThemedText>
      </View>
      <Button label={t('today.markDone')} onPress={onDone} style={styles.button} />
      <Pressable onPress={onDismiss} hitSlop={12} accessibilityLabel={t('common.cancel')}>
        <ThemedText style={{ color: theme.background, fontSize: 20 }}>×</ThemedText>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: Spacing.three,
    right: 96,
    bottom: Spacing.four,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    boxShadow: '0 6px 16px rgba(0,0,0,0.25)',
  },
  texts: { flex: 1 },
  button: { minHeight: 36, paddingHorizontal: Spacing.three },
});
