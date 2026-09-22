import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  LinearGradient,
  Oval,
  Path,
  Rect,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import type { DayBand } from '@/lib/time/day-bands';

import type { GardenSummary } from '../compute-garden';
import { buildTree, seededRandom, type BranchIdentity, type Point } from '../tree-geometry';

export type GardenCanvasProps = {
  summary: GardenSummary;
  /** Identities become branches; habits without identity get their own branch. */
  identities: BranchIdentity[];
  band: DayBand;
  /** 0–1 position of the sun (day) or moon (night) across the sky. */
  skyProgress: number;
  /** Share of today's habits still pending → clouds. */
  pendingRatio: number;
  width: number;
  height: number;
};

const SKY: Record<DayBand, [string, string]> = {
  morning: ['#FFC89A', '#FFF1E3'],
  afternoon: ['#8EC5FC', '#FFF7D9'],
  night: ['#0B1026', '#2B3A67'],
};
const GROUND: Record<DayBand, [string, string]> = {
  morning: ['#8CCB7E', '#4E9A5B'],
  afternoon: ['#7CC36E', '#3F8E4E'],
  night: ['#2F5A3A', '#1B3524'],
};
const BARK = '#7A5230';

function quadPath(start: Point, control: Point, end: Point) {
  const path = Skia.Path.Make();
  path.moveTo(start.x, start.y);
  path.quadTo(control.x, control.y, end.x, end.y);
  return path;
}

export default function GardenCanvas({
  summary,
  identities,
  band,
  skyProgress,
  pendingRatio,
  width,
  height,
}: GardenCanvasProps) {
  const tree = useMemo(() => buildTree(summary, width, height, identities), [summary, width, height, identities]);
  const isNight = band === 'night';

  // --- Animation values (run on the UI thread via Reanimated) ---
  const growth = useSharedValue(0);
  const sway = useSharedValue(0);
  const drift = useSharedValue(0);

  useEffect(() => {
    growth.set(withTiming(1, { duration: 1800, easing: Easing.out(Easing.cubic) }));
    sway.set(
      withRepeat(
        withSequence(
          withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
          withTiming(-1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
    drift.set(withRepeat(withTiming(1, { duration: 40_000, easing: Easing.linear }), -1, false));
  }, [growth, sway, drift]);

  // Trunk grows first, then branches, then leaves appear.
  const trunkEnd = useDerivedValue(() => Math.min(1, growth.get() / 0.4));
  const branchEnd = useDerivedValue(() => Math.max(0, Math.min(1, (growth.get() - 0.3) / 0.5)));
  const leafOpacity = useDerivedValue(() => Math.max(0, (growth.get() - 0.7) / 0.3));
  const swayTransform = useDerivedValue(() => [{ rotate: sway.get() * 0.012 }]);
  const cloudTransform = useDerivedValue(() => [{ translateX: drift.get() * width * 0.6 - width * 0.3 }]);

  const paths = useMemo(
    () => ({
      trunk: tree.trunk ? quadPath(tree.trunk.start, tree.trunk.control, tree.trunk.end) : null,
      branches: tree.branches.map((b) => quadPath(b.start, b.control, b.end)),
      roots: tree.roots.map((r) => quadPath(r.start, r.control, r.end)),
      ground: (() => {
        const p = Skia.Path.Make();
        p.moveTo(0, tree.ground.y + 6);
        p.quadTo(width / 2, tree.ground.y - 22, width, tree.ground.y + 6);
        p.lineTo(width, height);
        p.lineTo(0, height);
        p.close();
        return p;
      })(),
    }),
    [tree, width, height],
  );

  const stars = useMemo(() => {
    const random = seededRandom('stars');
    return Array.from({ length: 36 }, () => ({
      x: random() * width,
      y: random() * height * 0.6,
      r: 0.6 + random() * 1.2,
    }));
  }, [width, height]);

  // Sun / moon travel along an arc across the sky.
  const celestial = {
    x: width * (0.1 + 0.8 * skyProgress),
    y: height * (0.42 - 0.3 * Math.sin(Math.PI * skyProgress)),
  };
  const clouds = Math.round(pendingRatio * 3);

  return (
    <Canvas style={{ width, height }}>
      {/* Sky */}
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={SKY[band]} />
      </Rect>

      {isNight &&
        stars.map((s, i) => <Circle key={i} cx={s.x} cy={s.y} r={s.r} color="rgba(255,255,255,0.85)" />)}

      {isNight ? (
        <Group>
          <Circle cx={celestial.x} cy={celestial.y} r={20} color="#F4F1DE">
            <BlurMask blur={6} style="solid" />
          </Circle>
          <Circle cx={celestial.x + 8} cy={celestial.y - 5} r={17} color={SKY.night[0]} />
        </Group>
      ) : (
        <Circle cx={celestial.x} cy={celestial.y} r={24} color="#FFD36B">
          <BlurMask blur={10} style="solid" />
        </Circle>
      )}

      {/* Clouds: more pending habits today → cloudier sky */}
      <Group transform={cloudTransform}>
        {Array.from({ length: clouds }, (_, i) => {
          const cx = width * (0.25 + i * 0.28);
          const cy = height * (0.14 + (i % 2) * 0.1);
          const color = isNight ? 'rgba(200,210,230,0.35)' : 'rgba(255,255,255,0.9)';
          return (
            <Group key={i}>
              <Circle cx={cx} cy={cy} r={16} color={color} />
              <Circle cx={cx + 16} cy={cy - 8} r={20} color={color} />
              <Circle cx={cx + 36} cy={cy} r={15} color={color} />
            </Group>
          );
        })}
      </Group>

      {/* Ground */}
      <Path path={paths.ground}>
        <LinearGradient start={vec(0, tree.ground.y - 20)} end={vec(0, height)} colors={GROUND[band]} />
      </Path>

      {/* Roots: one per habit stack, growing underground */}
      {tree.roots.map((root, i) => (
        <Path
          key={root.key}
          path={paths.roots[i]}
          style="stroke"
          strokeWidth={2.5}
          strokeCap="round"
          color={root.color}
          opacity={0.6}
          end={branchEnd}
        />
      ))}

      {/* Tree, swaying gently around the base of the trunk */}
      <Group transform={swayTransform} origin={vec(tree.ground.x, tree.ground.y)}>
        {!tree.trunk && (
          <Group>
            <Oval x={tree.ground.x - 9} y={tree.ground.y - 8} width={18} height={11} color={BARK} />
            <Oval x={tree.ground.x - 2} y={tree.ground.y - 18} width={4} height={12} color="#5DBB63" />
          </Group>
        )}

        {tree.trunk && paths.trunk && (
          <Path
            path={paths.trunk}
            style="stroke"
            strokeWidth={tree.trunk.width}
            strokeCap="round"
            color={BARK}
            end={trunkEnd}
          />
        )}

        {/* Sprout leaves at the tip while there are no branches yet */}
        {tree.trunk && tree.branches.length === 0 && (
          <Group opacity={leafOpacity}>
            {[-1, 1].map((side) => (
              <Group
                key={side}
                transform={[
                  { translateX: tree.trunk!.end.x },
                  { translateY: tree.trunk!.end.y },
                  { rotate: side * 0.6 - Math.PI / 2 },
                ]}>
                <Oval x={0} y={-5} width={20} height={10} color="#5DBB63" />
              </Group>
            ))}
          </Group>
        )}

        {tree.branches.map((branch, i) => (
          <Group key={branch.key}>
            <Path
              path={paths.branches[i]}
              style="stroke"
              strokeWidth={branch.thickness}
              strokeCap="round"
              color={BARK}
              end={branchEnd}
            />
            <Group opacity={leafOpacity}>
              {branch.leaves.map((leaf, k) => (
                <Group
                  key={k}
                  transform={[{ translateX: leaf.x }, { translateY: leaf.y }, { rotate: leaf.angle }]}>
                  <Oval
                    x={0}
                    y={-leaf.size / 2.4}
                    width={leaf.size * 1.8}
                    height={leaf.size / 1.2}
                    color={leaf.color}
                    opacity={leaf.wilted ? 0.45 : 0.95}
                  />
                </Group>
              ))}
              {branch.flowers.map((f, k) => (
                <Group key={`f${k}`}>
                  <Circle cx={f.x} cy={f.y} r={5} color="#F7A1C4" />
                  <Circle cx={f.x} cy={f.y} r={2} color="#FFE08A" />
                </Group>
              ))}
              {branch.fruits.map((fruit, k) => (
                <Group key={`fruit${k}`}>
                  <Circle cx={fruit.x} cy={fruit.y} r={8} color={fruit.color} />
                  <Circle cx={fruit.x - 2.5} cy={fruit.y - 2.5} r={2.5} color="rgba(255,255,255,0.7)" />
                </Group>
              ))}
            </Group>
          </Group>
        ))}
      </Group>
    </Canvas>
  );
}
