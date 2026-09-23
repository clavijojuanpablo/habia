import { StyleSheet, View } from 'react-native';

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
};

/** A headline number: when the data is one value, the number is the chart. */
export function StatTile({ label, value, caption, emoji, tint = 'primarySoft' }: Props) {
  const theme = useTheme();

  return (
    <View
      style={[styles.tile, { backgroundColor: theme.backgroundElement }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}>
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
      <ThemedText style={styles.value}>{value}</ThemedText>
      {caption && (
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {caption}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: '45%',
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.half,
    boxShadow: Shadow.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: { width: 32, height: 32, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 17, lineHeight: 22 },
  flex: { flex: 1 },
  value: { fontSize: 30, lineHeight: 36, fontFamily: FontFamily.black },
});
