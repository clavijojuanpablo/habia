import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Shadow, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  label: string;
  value: string;
  caption?: string;
  emoji?: string;
  /** Pastel background for the emoji badge. */
  tint?: ThemeColor;
  /** Opens the detail behind the number (e.g. the streak screen). */
  onPress?: () => void;
};

/** A headline number: when the data is one value, the number is the chart. */
export function StatTile({ label, value, caption, emoji, tint = 'primarySoft', onPress }: Props) {
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
      accessibilityLabel={`${label}: ${value}${caption ? `, ${caption}` : ''}`}>
      <View style={styles.header}>
        {emoji && (
          <View style={[styles.badge, { backgroundColor: theme[tint] }]}>
            <ThemedText style={styles.emoji}>{emoji}</ThemedText>
          </View>
        )}
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2} style={styles.flex}>
          {label}
        </ThemedText>
      </View>
      <ThemedText style={styles.value}>{value}</ThemedText>
      {caption && (
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={2}>
          {caption}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    // Three per row on a phone, so the summary reads at a glance.
    flexBasis: '30%',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.half,
    boxShadow: Shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: { width: 26, height: 26, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 14, lineHeight: 18 },
  flex: { flex: 1 },
  value: { fontSize: 30, lineHeight: 36, fontFamily: FontFamily.black },
});
