import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

type Props = PropsWithChildren<{ emoji: string; title: string; subtitle?: string }>;

/** Shared frame for the auth screens: centered, friendly, keyboard-aware. */
export function AuthLayout({ emoji, title, subtitle, children }: Props) {
  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <ThemedText style={styles.emoji}>{emoji}</ThemedText>
            <ThemedText type="title" style={styles.center}>
              {title}
            </ThemedText>
            {subtitle && (
              <ThemedText themeColor="textSecondary" style={[styles.center, styles.subtitle]}>
                {subtitle}
              </ThemedText>
            )}
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
  },
  emoji: { fontSize: 72, lineHeight: 84, textAlign: 'center' },
  subtitle: { marginBottom: Spacing.two },
});
