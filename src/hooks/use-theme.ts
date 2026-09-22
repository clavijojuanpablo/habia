/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { BandColors, Colors, HeatmapRamp } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

function useMode() {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

export function useTheme() {
  return Colors[useMode()];
}

export function useBandColors() {
  return BandColors[useMode()];
}

export function useHeatmapRamp() {
  return HeatmapRamp[useMode()];
}
