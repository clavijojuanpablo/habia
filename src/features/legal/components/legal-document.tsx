import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { getLegal, LEGAL_UPDATED, type LegalKind } from '../content';

/** Renders a legal document, readable both signed in and signed out. */
export function LegalDocumentScreen({ kind }: { kind: LegalKind }) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const doc = getLegal(kind, i18n.language);

  return (
    <ThemedView style={styles.flex}>
      <SafeAreaView style={styles.flex} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            accessibilityLabel={t('common.close')}
            hitSlop={8}
            style={[styles.close, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText type="heading">✕</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">{doc.title}</ThemedText>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('legal.updated', { date: LEGAL_UPDATED })}
          </ThemedText>

          <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText>{doc.intro}</ThemedText>
          </View>

          {doc.sections.map((section) => (
            <View key={section.heading} style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="heading">{section.heading}</ThemedText>
              {section.body.map((paragraph, i) => (
                <ThemedText key={i} type="small" themeColor="textSecondary">
                  {paragraph}
                </ThemedText>
              ))}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { alignItems: 'flex-end', paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  close: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.two, boxShadow: Shadow.card },
});
