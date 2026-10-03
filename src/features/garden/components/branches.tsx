import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { identityEmoji } from '@/features/identities/api';
import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';

import type { Branch } from '../compute-branches';

/** One identity = one branch of the tree, in its color, with the habits that feed it. */
export function BranchCard({ branch }: { branch: Branch }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const color = branch.identity.color ?? theme.primary;
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/identity/[id]', params: { id: branch.identity.id } })}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        styles.branch,
        { backgroundColor: theme.backgroundElement, borderLeftColor: color, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <View style={styles.titleRow}>
        <ThemedText style={styles.emoji}>{identityEmoji(branch.identity)}</ThemedText>
        <View style={styles.flex}>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('identity.becoming')}
          </ThemedText>
          <ThemedText type="heading">{branch.identity.statement}</ThemedText>
        </View>
      </View>
      <ThemedText type="smallBold" style={{ color }}>
        🌱 {t('garden.seedsThisWeek', { count: branch.seedsThisWeek })}
      </ThemedText>
      {branch.habits.length > 0 ? (
        <View style={styles.chips}>
          {branch.habits.map((h) => (
            <View key={h.id} style={[styles.chip, { backgroundColor: theme.background }]}>
              <ThemedText type="small">
                {h.icon} {h.name}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : (
        <ThemedText type="small" themeColor="textSecondary">
          {t('garden.branchEmpty')}
        </ThemedText>
      )}
    </Pressable>
  );
}

/** No identity yet: explain the idea with examples and offer the first branch. */
export function NoBranches() {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={[styles.card, styles.empty, { backgroundColor: theme.backgroundElement }]}>
      <Brote mood="cheer" size={72} />
      <ThemedText type="heading" style={styles.center}>
        {t('garden.emptyTitle')}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
        {t('garden.emptyBody')}
      </ThemedText>
      <Button label={t('garden.createBranch')} onPress={() => router.push('/identity/new')} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  branch: { borderLeftWidth: 6, boxShadow: Shadow.card },
  empty: { alignItems: 'center', boxShadow: Shadow.card },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  emoji: { fontSize: 22, lineHeight: 28 },
  flex: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: 'transparent',
    maxWidth: '100%',
  },
  center: { textAlign: 'center' },
});
