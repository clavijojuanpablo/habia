import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Shadow, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  value: string;
  /** Small text after the number, on its baseline ("días", "de 31", "%"). */
  unit?: string;
  caption?: string;
  emoji?: string;
  /** Pastel background for the emoji badge. */
  tint?: ThemeColor;
  /** Opens the detail behind the number (e.g. the streak screen). */
  onPress?: () => void;
};

/**
 * A headline number: when the data is one value, the number is the chart. Every tile has the
 * same three rows (label, number + unit, one-line caption) so a 2×2 grid lines up.
 */
export function StatTile({ label, value, unit, caption, emoji, tint = 'primarySoft', onPress }: Props) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: theme.backgroundElement, transform: [{ scale: pressed ? 0.97 : 1 }] },
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={`${label}: ${value}${unit ? ` ${unit}` : ''}${caption ? `, ${caption}` : ''}`}>
      <View style={styles.header}>
        {emoji && (
          <View style={[styles.badge, { backgroundColor: theme[tint] }]}>
            <ThemedText style={styles.emoji}>{emoji}</ThemedText>
          </View>
        )}
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.flex}>
          {label}
        </ThemedText>
      </View>
      <View style={styles.valueRow}>
        <ThemedText style={styles.value}>{value}</ThemedText>
        {unit && (
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.unit}>
            {unit}
          </ThemedText>
        )}
      </View>
      {caption && (
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {caption}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    // Two per row: room for a number and its unit side by side.
    flexBasis: '45%',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.one,
    boxShadow: Shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: { width: 28, height: 28, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 15, lineHeight: 20 },
  flex: { flex: 1 },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.one },
  value: { fontSize: 30, lineHeight: 36, fontFamily: FontFamily.black },
  unit: { flexShrink: 1 },
});
