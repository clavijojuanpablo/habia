import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { HabitColors, Radius } from '@/constants/theme';

const PIECES = 28;

/** Falling paper pieces, drawn as plain Views animated on the UI thread. */
export function Confetti() {
  const { width, height } = useWindowDimensions();

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: PIECES }, (_, i) => (
        <Piece key={i} index={i} width={width} height={height} />
      ))}
    </View>
  );
}

function Piece({ index, width, height }: { index: number; width: number; height: number }) {
  const progress = useSharedValue(0);
  // Deterministic spread so pieces do not stack in the same column.
  const startX = ((index * 37) % 100) / 100;
  const drift = (((index * 53) % 100) / 100 - 0.5) * 80;
  const size = 8 + (index % 4) * 3;
  const color = HabitColors[index % HabitColors.length];
  const spin = (index % 2 === 0 ? 1 : -1) * (2 + (index % 3));

  useEffect(() => {
    progress.set(
      withDelay(
        (index % 10) * 60,
        withTiming(1, { duration: 1800 + (index % 5) * 250, easing: Easing.out(Easing.quad) }),
      ),
    );
  }, [index, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: 1 - Math.max(0, progress.get() - 0.7) / 0.3,
    transform: [
      { translateY: -40 + progress.get() * (height * 0.9) },
      { translateX: progress.get() * drift },
      { rotate: `${progress.get() * spin * 360}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        { left: startX * width, width: size, height: size * 1.6, backgroundColor: color },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  piece: { position: 'absolute', top: 0, borderRadius: Radius.sm / 4 },
});
