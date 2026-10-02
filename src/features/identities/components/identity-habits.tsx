import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useAssignIdentity, useHabits } from '@/features/habits/api';
import { useTheme } from '@/hooks/use-theme';

import type { Identity } from '../api';

/**
 * The habits that feed this branch, each removable from it in one tap (the habit stays, it just
 * stops growing this branch), and the other habits, addable in one tap.
 */
export function IdentityHabits({ identity }: { identity: Identity }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: habits = [] } = useHabits();
  const assign = useAssignIdentity();
  const color = identity.color ?? theme.primary;
  const linked = habits.filter((h) => h.identity_id === identity.id);
  const others = habits.filter((h) => h.identity_id !== identity.id);

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{t('identity.habitsTitle')}</ThemedText>
      {linked.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          {t('identity.habitsEmpty')}
        </ThemedText>
      )}
      {linked.map((habit) => (
        <View key={habit.id} style={[styles.row, { backgroundColor: theme.backgroundElement, borderLeftColor: color }]}>
          <ThemedText style={styles.icon}>{habit.icon}</ThemedText>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
            {habit.name}
          </ThemedText>
          <Pressable
            onPress={() => assign.mutate({ habitId: habit.id, identityId: null })}
            accessibilityRole="button"
            accessibilityLabel={t('identity.removeHabit', { habit: habit.name })}
            hitSlop={8}
            style={[styles.remove, { backgroundColor: theme.background }]}>
            <ThemedText type="caption" themeColor="textSecondary">
              ✕ {t('identity.remove')}
            </ThemedText>
          </Pressable>
        </View>
      ))}

      {others.length > 0 && (
        <>
          <ThemedText type="caption" themeColor="textSecondary">
            {t('identity.addHabitsHint')}
          </ThemedText>
          <View style={styles.chips}>
            {others.map((habit) => (
              <Pressable
                key={habit.id}
                onPress={() => assign.mutate({ habitId: habit.id, identityId: identity.id })}
                accessibilityRole="button"
                accessibilityLabel={t('identity.addHabit', { habit: habit.name })}
                style={[styles.chip, { backgroundColor: theme.backgroundElement, borderColor: color }]}>
                <ThemedText type="small" numberOfLines={1}>
                  + {habit.icon} {habit.name}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    padding: Spacing.two,
    paddingLeft: Spacing.three,
    borderRadius: Radius.md,
    borderLeftWidth: 5,
  },
  icon: { fontSize: 22, lineHeight: 28 },
  flex: { flex: 1 },
  remove: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.one, borderRadius: Radius.pill },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    maxWidth: '100%',
  },
});
