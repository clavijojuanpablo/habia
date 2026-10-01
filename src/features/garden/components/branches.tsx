import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import type { Habit } from '@/features/habits/api';
import { useAssignIdentity } from '@/features/habits/api';
import { identityEmoji, type Identity } from '@/features/identities/api';
import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';

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

/** Habits that grow no branch yet: say why, and link each one to an identity in one tap. */
export function LooseSeeds({ habits, identities }: { habits: Habit[]; identities: Identity[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const assign = useAssignIdentity();
  return (
    <View style={[styles.card, styles.loose, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="heading">🌱 {t('garden.looseTitle')}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {t('garden.looseBody')}
      </ThemedText>
      {habits.map((habit) => (
        <View key={habit.id} style={styles.looseRow}>
          <ThemedText type="smallBold">
            {habit.icon} {habit.name}
          </ThemedText>
          <View style={styles.chips}>
            {identities.map((identity) => (
              <Pressable
                key={identity.id}
                onPress={() => {
                  track('habit_branch_assigned');
                  assign.mutate({ habitId: habit.id, identityId: identity.id });
                }}
                accessibilityRole="button"
                accessibilityLabel={t('garden.assignTo', { habit: habit.name, identity: identity.statement })}
                style={[styles.chip, { backgroundColor: theme.background, borderColor: identity.color ?? theme.primary }]}>
                <ThemedText type="small" numberOfLines={1}>
                  {identityEmoji(identity)} {identity.statement}
                </ThemedText>
              </Pressable>
            ))}
            <Pressable
              onPress={() => router.push('/identity/new')}
              accessibilityRole="button"
              style={[styles.chip, { backgroundColor: theme.primarySoft }]}>
              <ThemedText type="smallBold" style={{ color: theme.primary }}>
                {t('garden.newBranch')}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
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
  loose: { borderWidth: 2, borderStyle: 'dashed' },
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
  looseRow: { gap: Spacing.one },
  center: { textAlign: 'center' },
});
