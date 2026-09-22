import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSaveHabit } from '@/features/habits/api';
import { HabitForm } from '@/features/habits/components/habit-form';
import { useTheme } from '@/hooks/use-theme';

export default function NewHabitScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const save = useSaveHabit();

  return (
    <ThemedView style={{ flex: 1 }}>
      {save.error && (
        <ThemedText type="small" style={{ color: theme.danger, padding: 16 }}>
          {t('common.error')}
        </ThemedText>
      )}
      <HabitForm
        submitting={save.isPending}
        onSubmit={(input) => save.mutate(input, { onSuccess: () => router.back() })}
      />
    </ThemedView>
  );
}
