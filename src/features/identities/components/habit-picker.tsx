import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useHabits } from '@/features/habits/api';
import { useTheme } from '@/hooks/use-theme';

import { identityEmoji, useIdentities } from '../api';

/**
 * Your habits as chips to pick for a new branch. Habits that feed no branch come first; one that
 * already feeds another shows its emoji and moves over if picked.
 */
export function HabitPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: habits = [] } = useHabits();
  const { data: identities = [] } = useIdentities();
  if (habits.length === 0) return null;

  const branchOf = (identityId: string | null) => identities.find((i) => i.id === identityId);
  const ordered = [...habits].sort((a, b) => Number(!!a.identity_id) - Number(!!b.identity_id));
  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{t('identity.pickHabits')}</ThemedText>
      <View style={styles.chips}>
        {ordered.map((habit) => {
          const picked = selected.includes(habit.id);
          const other = branchOf(habit.identity_id);
          return (
            <Pressable
              key={habit.id}
              onPress={() => toggle(habit.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: picked }}
              style={[
                styles.chip,
                {
                  backgroundColor: picked ? theme.primarySoft : theme.backgroundElement,
                  borderColor: picked ? theme.primary : theme.border,
                },
              ]}>
              <ThemedText type="small" numberOfLines={1}>
                {picked ? '✓ ' : ''}
                {habit.icon} {habit.name}
                {other && !picked ? ` · ${identityEmoji(other)}` : ''}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    borderWidth: 2,
    maxWidth: '100%',
  },
});
