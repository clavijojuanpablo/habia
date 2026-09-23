import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

export type BroteMood = 'happy' | 'celebrate' | 'sleepy' | 'cheer';

type Props = {
  mood?: BroteMood;
  size?: number;
  /** Set false for a still mascot (lists, small badges). */
  animated?: boolean;
};

const BODY = '#5FD69A';
const BODY_DARK = '#2FA56A';
const LEAF = '#3DBE7A';
const INK = '#2E2A3B';
const CHEEK = '#FF9FB0';

/**
 * Brote: the app's mascot, a sprout that grows with the user.
 * Drawn as SVG so it scales, weighs nothing and can change expression by prop.
 */
export function Brote({ mood = 'happy', size = 120, animated = true }: Props) {
  const bounce = useSharedValue(0);

  useEffect(() => {
    if (!animated) return;
    const distance = mood === 'celebrate' ? 1 : 0.45;
    bounce.set(
      withRepeat(
        withSequence(
          withTiming(distance, { duration: mood === 'celebrate' ? 420 : 1100, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: mood === 'celebrate' ? 420 : 1100, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
      ),
    );
  }, [animated, bounce, mood]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -bounce.get() * 6 }, { scale: 1 + bounce.get() * 0.03 }],
  }));

  return (
    <Animated.View style={style}>
      <Svg width={size} height={size} viewBox="0 0 120 120">
        {/* Leaves: raised when celebrating */}
        <G>
          <Path
            d={mood === 'celebrate' ? 'M60 46 C40 44 28 30 30 16 C46 14 58 26 60 46 Z' : 'M60 48 C42 50 30 40 30 26 C46 22 58 32 60 48 Z'}
            fill={LEAF}
          />
          <Path
            d={mood === 'celebrate' ? 'M60 46 C80 44 92 30 90 16 C74 14 62 26 60 46 Z' : 'M60 48 C78 50 90 40 90 26 C74 22 62 32 60 48 Z'}
            fill={BODY}
          />
          <Path d="M59 62 L59 42 Q60 38 61 42 L61 62 Z" fill={BODY_DARK} />
        </G>

        {/* Body */}
        <Ellipse cx={60} cy={82} rx={30} ry={28} fill={BODY} />
        <Ellipse cx={60} cy={86} rx={24} ry={21} fill="#7BE3AE" opacity={0.6} />

        {/* Face */}
        {mood === 'sleepy' ? (
          <>
            <Path d="M46 78 q5 -6 10 0" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
            <Path d="M64 78 q5 -6 10 0" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
          </>
        ) : (
          <>
            <Circle cx={51} cy={78} r={4} fill={INK} />
            <Circle cx={69} cy={78} r={4} fill={INK} />
            <Circle cx={52.5} cy={76.5} r={1.4} fill="#FFFFFF" />
            <Circle cx={70.5} cy={76.5} r={1.4} fill="#FFFFFF" />
          </>
        )}

        <Circle cx={42} cy={86} r={5} fill={CHEEK} opacity={0.65} />
        <Circle cx={78} cy={86} r={5} fill={CHEEK} opacity={0.65} />

        {mood === 'celebrate' ? (
          <Ellipse cx={60} cy={90} rx={7} ry={6} fill={INK} />
        ) : mood === 'cheer' ? (
          <Path d="M50 88 q10 10 20 0" stroke={INK} strokeWidth={3.5} strokeLinecap="round" fill="none" />
        ) : (
          <Path d="M53 88 q7 7 14 0" stroke={INK} strokeWidth={3} strokeLinecap="round" fill="none" />
        )}

        {/* Sparkles while celebrating */}
        {mood === 'celebrate' && (
          <G fill="#F5B92E">
            <Circle cx={22} cy={40} r={3} />
            <Circle cx={100} cy={48} r={3.5} />
            <Circle cx={30} cy={96} r={2.5} />
            <Circle cx={96} cy={90} r={2.5} />
          </G>
        )}

        {mood === 'sleepy' && (
          <G fill={INK} opacity={0.5}>
            <Circle cx={92} cy={58} r={3} />
            <Circle cx={100} cy={48} r={2} />
          </G>
        )}
      </Svg>
    </Animated.View>
  );
}
