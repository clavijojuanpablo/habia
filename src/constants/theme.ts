/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    primary: '#2F9E6B',
    onPrimary: '#ffffff',
    border: '#E0E1E6',
    danger: '#D64545',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    primary: '#3DBA82',
    onPrimary: '#0B1A12',
    border: '#2E3135',
    danger: '#F07070',
  },
} as const;

/** Day-band palettes: warm dawn, golden afternoon, deep-blue night. */
export const BandColors = {
  light: {
    morning: { background: '#FFF1E3', accent: '#F2994A' },
    afternoon: { background: '#FFF7D9', accent: '#D9A21B' },
    night: { background: '#E7EAFA', accent: '#4F5BD5' },
    anytime: { background: '#EEF6F1', accent: '#2F9E6B' },
  },
  dark: {
    morning: { background: '#33251A', accent: '#F2A65A' },
    afternoon: { background: '#332C14', accent: '#E8B936' },
    night: { background: '#191D38', accent: '#8C96F0' },
    anytime: { background: '#16271E', accent: '#3DBA82' },
  },
} as const;

export type BandKey = keyof typeof BandColors.light;

/**
 * Sequential ramp for the completion heatmap (low → high), one hue.
 * Validated for step visibility and contrast against each mode's surface.
 */
export const HeatmapRamp = {
  light: ['#7CC59D', '#52AD7D', '#358F61', '#26714C', '#1A5236'],
  dark: ['#2C6446', '#2F8158', '#37A06C', '#4FC088', '#93E2BA'],
} as const;

/** Palette offered when creating a habit. */
export const HabitColors = [
  '#2F9E6B',
  '#F2994A',
  '#4F5BD5',
  '#D64545',
  '#D9A21B',
  '#9B51E0',
  '#2D9CDB',
  '#E05297',
];

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
