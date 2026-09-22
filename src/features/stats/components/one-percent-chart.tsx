import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/hooks/use-theme';

import { ChartCard } from './chart-card';

const HEIGHT = 170;
const PAD = { top: 16, right: 64, bottom: 12, left: 8 };

type Props = { actual: number[]; ideal: number[] };

function linePath(values: number[], x: (i: number) => number, y: (v: number) => number) {
  return values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
}

/**
 * The 1% rule on ONE axis: both lines are the same unit (an index starting at 1×),
 * so the comparison is honest. Your line is emphasized; the ideal is recessive context.
 */
export function OnePercentChart({ actual, ideal }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);

  const all = [...actual, ...ideal, 1];
  const min = Math.min(...all) * 0.99;
  const max = Math.max(...all) * 1.01;
  const innerW = Math.max(1, width - PAD.left - PAD.right);
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (actual.length - 1)) * innerW;
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * innerH;

  const last = actual.length - 1;
  const fmt = (v: number) => `${v.toFixed(2)}×`;

  // Keep the two end labels at least 14px apart so they never overlap.
  let youY = y(actual[last]) + 4;
  let idealY = y(ideal[last]) + 4;
  if (Math.abs(youY - idealY) < 14) {
    const mid = (youY + idealY) / 2;
    const youAbove = actual[last] >= ideal[last];
    youY = mid + (youAbove ? -7 : 7);
    idealY = mid + (youAbove ? 7 : -7);
  }

  return (
    <ChartCard
      title={t('progress.onePercentTitle')}
      subtitle={t('progress.onePercentSubtitle')}
      detail={
        selected !== null
          ? t('progress.onePercentDetail', { day: selected, you: fmt(actual[selected]), ideal: fmt(ideal[selected]) })
          : null
      }>
      <Pressable
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        onPress={(e) => {
          const i = Math.round(((e.nativeEvent.locationX - PAD.left) / innerW) * last);
          setSelected(i >= 0 && i <= last ? i : null);
        }}
        accessibilityLabel={t('progress.onePercentA11y', { you: fmt(actual[last]), ideal: fmt(ideal[last]) })}>
        <View style={{ height: HEIGHT }}>
          {width > 0 && (
            <Svg width={width} height={HEIGHT}>
              {/* Baseline: 1× = where you started */}
              <Line x1={PAD.left} x2={PAD.left + innerW} y1={y(1)} y2={y(1)} stroke={theme.border} strokeWidth={1} />
              <Path d={linePath(ideal, x, y)} stroke={theme.textSecondary} strokeWidth={2} strokeDasharray="4 4" fill="none" />
              <Path d={linePath(actual, x, y)} stroke={theme.primary} strokeWidth={2.5} fill="none" strokeLinejoin="round" />

              {/* Direct labels at the line ends, in text ink */}
              <Circle cx={x(last)} cy={y(actual[last])} r={4} fill={theme.primary} stroke={theme.backgroundElement} strokeWidth={2} />
              <SvgText x={x(last) + 8} y={youY} fill={theme.text} fontSize={12} fontWeight="700">
                {`${t('progress.you')} ${fmt(actual[last])}`}
              </SvgText>
              <SvgText x={x(last) + 8} y={idealY} fill={theme.textSecondary} fontSize={11}>
                {`1% ${fmt(ideal[last])}`}
              </SvgText>

              {selected !== null && (
                <>
                  <Line x1={x(selected)} x2={x(selected)} y1={PAD.top} y2={PAD.top + innerH} stroke={theme.textSecondary} strokeWidth={1} />
                  <Circle cx={x(selected)} cy={y(actual[selected])} r={5} fill={theme.primary} stroke={theme.backgroundElement} strokeWidth={2} />
                </>
              )}
            </Svg>
          )}
        </View>
      </Pressable>
    </ChartCard>
  );
}
