import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';

import { Confetti } from './confetti';

const AUTO_DISMISS_MS = 5000;

type Props = { votes: number; onDismiss: () => void };

/** Reward for finishing the day: confetti, Brote celebrating and the day's votes. */
export function DayCompleteOverlay({ votes, onDismiss }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel={t('common.close')} />
      <Confetti />
      <View style={[styles.card, { backgroundColor: theme.backgroundElement }]} pointerEvents="none">
        <Brote mood="celebrate" size={150} />
        <ThemedText type="subtitle" style={styles.center}>
          {t('celebration.title')}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.center}>
          {t('celebration.body', { count: votes })}
        </ThemedText>
        <View style={[styles.pill, { backgroundColor: theme.primarySoft }]}>
          <ThemedText type="smallBold" style={{ color: theme.primary }}>
            {t('celebration.votes', { count: votes })}
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20,16,28,0.45)',
    padding: Spacing.four,
  },
  card: {
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
    borderRadius: Radius.xl,
    boxShadow: Shadow.raised,
    maxWidth: 420,
    width: '100%',
  },
  center: { textAlign: 'center' },
  pill: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.one, borderRadius: Radius.pill },
});
