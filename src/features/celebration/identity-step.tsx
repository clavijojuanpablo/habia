import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { identityEmoji, type Identity } from '@/features/identities/api';
import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';

const AUTO_DISMISS_MS = 3500;
const SEEDS = [0, 1, 2, 3, 4];

/**
 * Finishing every habit of an identity today: not the day's confetti but a card that rises from
 * the bottom in the branch's color, seeds that float up and turn into leaves, and the branch
 * filling up. "Today you are closer to becoming <identity>".
 */
export function IdentityStepToast({ identity, onDismiss }: { identity: Identity; onDismiss: () => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const color = identity.color ?? theme.primary;
  const growth = useSharedValue(0);

  useEffect(() => {
    growth.set(withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [growth, onDismiss]);

  const branchStyle = useAnimatedStyle(() => ({ width: `${growth.get() * 100}%` }));

  return (
    <Animated.View entering={SlideInDown.springify().damping(16)} exiting={SlideOutDown} style={styles.wrapper}>
      <Pressable
        onPress={onDismiss}
        accessibilityRole="alert"
        accessibilityLabel={`${t('celebration.identityLead')} ${identity.statement}`}
        style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: color }]}>
        <View style={styles.seeds} pointerEvents="none">
          {SEEDS.map((i) => (
            <RisingSeed key={i} index={i} />
          ))}
        </View>
        <View style={styles.row}>
          <Brote mood="cheer" size={64} />
          <View style={styles.flex}>
            <ThemedText type="small" themeColor="textSecondary">
              {t('celebration.identityLead')}
            </ThemedText>
            <ThemedText type="heading" style={{ color }}>
              {identityEmoji(identity)} {identity.statement}
            </ThemedText>
          </View>
        </View>
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          <Animated.View style={[styles.fill, { backgroundColor: color }, branchStyle]} />
        </View>
        <ThemedText type="caption" themeColor="textSecondary">
          {t('celebration.identityDone')}
        </ThemedText>
      </Pressable>
    </Animated.View>
  );
}

/** A seed that floats up from the card and becomes a leaf on the way. */
function RisingSeed({ index }: { index: number }) {
  const rise = useSharedValue(0);
  const [leaf, setLeaf] = useState(false);

  useEffect(() => {
    rise.set(withDelay(index * 160, withTiming(1, { duration: 1500, easing: Easing.out(Easing.quad) })));
    const timer = setTimeout(() => setLeaf(true), index * 160 + 700);
    return () => clearTimeout(timer);
  }, [index, rise]);

  const style = useAnimatedStyle(() => ({
    opacity: rise.get() === 0 ? 0 : 1 - rise.get(),
    transform: [{ translateY: -rise.get() * 90 }, { rotate: `${(index % 2 ? 1 : -1) * rise.get() * 25}deg` }],
  }));

  return (
    <Animated.Text style={[styles.seed, { left: `${12 + index * 19}%` }, style]}>{leaf ? '🍃' : '🌱'}</Animated.Text>
  );
}

const styles = StyleSheet.create({
  // Leaves room for the floating "+" button, like ChainPrompt.
  wrapper: {
    position: 'absolute',
    left: Spacing.three,
    right: 96,
    bottom: Spacing.four,
    alignItems: 'center',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 2,
    boxShadow: Shadow.raised,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
  track: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
  seeds: { position: 'absolute', left: 0, right: 0, top: 0, height: 1 },
  seed: { position: 'absolute', top: -8, fontSize: 22, lineHeight: 28 },
});
