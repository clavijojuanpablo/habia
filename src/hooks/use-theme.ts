import { BandColors, Colors, HeatmapRamp } from '@/constants/theme';
import { useAppearance } from '@/features/appearance/appearance-provider';

/** The active color mode, from the user's appearance preference (light by default). */
export function useColorMode() {
  return useAppearance().mode;
}

export function useTheme() {
  return Colors[useColorMode()];
}

export function useBandColors() {
  return BandColors[useColorMode()];
}

export function useHeatmapRamp() {
  return HeatmapRamp[useColorMode()];
}
