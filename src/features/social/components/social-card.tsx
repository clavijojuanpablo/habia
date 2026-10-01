import { StyleSheet, View, type ViewStyle } from 'react-native';

import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function SocialCard({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.backgroundElement }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two, boxShadow: Shadow.card },
});
