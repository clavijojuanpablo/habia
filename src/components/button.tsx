import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  loading?: boolean;
};

/**
 * Chunky, tactile button: a darker bottom edge that "presses in" on tap
 * (the playful 3D style popularized by Duolingo).
 */
export function Button({ label, variant = 'primary', loading, disabled, style, ...rest }: ButtonProps) {
  const theme = useTheme();
  const palette = {
    primary: { bg: theme.primary, edge: theme.primaryDark, fg: theme.onPrimary },
    secondary: { bg: theme.backgroundElement, edge: theme.border, fg: theme.text },
    danger: { bg: 'transparent', edge: 'transparent', fg: theme.danger },
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={(state) => [
        styles.button,
        {
          backgroundColor: palette.bg,
          borderColor: variant === 'secondary' ? theme.border : 'transparent',
          borderBottomColor: palette.edge,
          borderBottomWidth: state.pressed ? 2 : 5,
          marginTop: state.pressed ? 3 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <ThemedText type="heading" style={{ color: palette.fg, fontSize: 16 }}>
          {label}
        </ThemedText>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 2,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
