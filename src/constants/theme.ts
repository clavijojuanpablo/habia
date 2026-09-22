/**
 * Design tokens. Every screen reads colors, spacing, radii and fonts from here,
 * so the whole app can be re-themed in one place (light is the default mode).
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    /** App canvas: warm cream so white cards pop. */
    background: '#FFF8F1',
    /** Cards, inputs, sheets. */
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#F3ECE3',
    text: '#2E2A3B',
    textSecondary: '#8C8699',
    primary: '#3DBE7A',
    /** Bottom edge of chunky buttons. */
    primaryDark: '#2C9A60',
    onPrimary: '#FFFFFF',
    primarySoft: '#DDF6E8',
    border: '#EFE6DB',
    danger: '#F2667A',
    todayColumn: 'rgba(255,255,255,0.65)',
    streak: '#FF9F43',
    streakSoft: '#FFE9D2',
    gold: '#F5B92E',
    goldSoft: '#FFF3C9',
    lavender: '#7B6CF6',
    lavenderSoft: '#ECE8FF',
    tabBar: '#FFFFFF',
  },
  dark: {
    background: '#16141D',
    backgroundElement: '#221F2C',
    backgroundSelected: '#2D2A39',
    text: '#F5F2FA',
    textSecondary: '#A6A1B5',
    primary: '#52D18F',
    primaryDark: '#35A06A',
    onPrimary: '#0E2A1B',
    primarySoft: '#1F3A2C',
    border: '#2F2B3B',
    danger: '#FF8093',
    todayColumn: 'rgba(255,255,255,0.06)',
    streak: '#FFB066',
    streakSoft: '#3A2A1A',
    gold: '#FFD466',
    goldSoft: '#3A331A',
    lavender: '#A89CFF',
    lavenderSoft: '#2A2644',
    tabBar: '#221F2C',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

/** Day-band palettes: peach dawn, butter afternoon, lavender night, mint any-time. */
export const BandColors = {
  light: {
    morning: { background: '#FFE7D6', accent: '#E9793A' },
    afternoon: { background: '#FFF3C4', accent: '#C98F0B' },
    night: { background: '#E6E1FF', accent: '#6453D6' },
    anytime: { background: '#D9F5E6', accent: '#23965C' },
  },
  dark: {
    morning: { background: '#3A2A22', accent: '#FFB085' },
    afternoon: { background: '#3A3420', accent: '#F2C94C' },
    night: { background: '#2A2644', accent: '#B3A8FF' },
    anytime: { background: '#1F3A2C', accent: '#6EE0A5' },
  },
} as const;

export type BandKey = keyof typeof BandColors.light;

export const BandEmoji: Record<BandKey, string> = {
  morning: '🌅',
  afternoon: '☀️',
  night: '🌙',
  anytime: '✨',
};

/**
 * Sequential ramp for the completion heatmap (low → high), one hue.
 * Validated for step visibility and contrast against each mode's card surface.
 */
export const HeatmapRamp = {
  light: ['#7CC59D', '#52AD7D', '#358F61', '#26714C', '#1A5236'],
  dark: ['#2C6446', '#2F8158', '#37A06C', '#4FC088', '#93E2BA'],
} as const;

/** Palette offered when creating a habit: bright but friendly. */
export const HabitColors = [
  '#3DBE7A',
  '#FF9F43',
  '#7B6CF6',
  '#F2667A',
  '#F5B92E',
  '#4CB4F0',
  '#EF7BC0',
  '#2FBFB0',
];

/** Nunito: rounded and friendly. Each weight is its own family on native. */
export const FontFamily = {
  regular: 'Nunito_600SemiBold',
  medium: 'Nunito_700Bold',
  bold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
} as const;

export const Fonts = Platform.select({
  ios: { sans: 'system-ui', serif: 'ui-serif', rounded: 'ui-rounded', mono: 'ui-monospace' },
  default: { sans: 'normal', serif: 'serif', rounded: 'normal', mono: 'monospace' },
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

export const Radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

/** Soft, warm shadows (cross-platform `boxShadow`, supported by RN 0.76+ and web). */
export const Shadow = {
  card: '0 4px 14px rgba(46, 42, 59, 0.07)',
  raised: '0 8px 24px rgba(46, 42, 59, 0.12)',
} as const;

/** Space reserved at the bottom of scroll views for the floating tab bar. */
export const TabBarSpace = 110;
export const MaxContentWidth = 800;
