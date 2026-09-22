import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type Props = { label: string; value: string; caption?: string };

/** A headline number: when the data is one value, the number is the chart. */
export function StatTile({ label, value, caption }: Props) {
  return (
    <ThemedView type="backgroundElement" style={styles.tile} accessible accessibilityLabel={`${label}: ${value}`}>
      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText style={styles.value}>{value}</ThemedText>
      {caption && (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
          {caption}
        </ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tile: { flexGrow: 1, flexBasis: '45%', borderRadius: Spacing.three, padding: Spacing.three, gap: Spacing.half },
  value: { fontSize: 28, lineHeight: 34, fontWeight: 700 },
});
