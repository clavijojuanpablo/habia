import type { PropsWithChildren } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Shadow, Spacing } from '@/constants/theme';

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  /** Detail of the tapped mark (mobile equivalent of a hover tooltip). */
  detail?: string | null;
}>;

export function ChartCard({ title, subtitle, detail, children }: Props) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <ThemedText type="heading">{title}</ThemedText>
      {subtitle && (
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      )}
      {children}
      <ThemedText type="small" themeColor="textSecondary" style={styles.detail}>
        {detail ?? ' '}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two, boxShadow: Shadow.card },
  detail: { minHeight: 20 },
});
