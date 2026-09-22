import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type StepperProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

export function Stepper({ label, value, min, max, onChange }: StepperProps) {
  const theme = useTheme();
  const step = (delta: number) => onChange(Math.min(max, Math.max(min, value + delta)));

  return (
    <View style={styles.stepper}>
      <Pressable
        onPress={() => step(-1)}
        disabled={value <= min}
        accessibilityLabel="-"
        style={[styles.button, { backgroundColor: theme.backgroundElement, opacity: value <= min ? 0.4 : 1 }]}>
        <ThemedText type="subtitle">−</ThemedText>
      </Pressable>
      <ThemedText type="default" style={styles.label}>
        {label}
      </ThemedText>
      <Pressable
        onPress={() => step(1)}
        disabled={value >= max}
        accessibilityLabel="+"
        style={[styles.button, { backgroundColor: theme.backgroundElement, opacity: value >= max ? 0.4 : 1 }]}>
        <ThemedText type="subtitle">+</ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  button: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, textAlign: 'center' },
});
