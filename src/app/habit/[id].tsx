import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Platform } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useArchiveHabit, useHabit, useSaveHabit } from '@/features/habits/api';
import { HabitForm } from '@/features/habits/components/habit-form';
import { useTheme } from '@/hooks/use-theme';

function confirm(message: string, onConfirm: () => void, labels: { ok: string; cancel: string }) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert(message, undefined, [
    { text: labels.cancel, style: 'cancel' },
    { text: labels.ok, style: 'destructive', onPress: onConfirm },
  ]);
}

export default function EditHabitScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: habit, isLoading } = useHabit(id);
  const save = useSaveHabit();
  const archive = useArchiveHabit();

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} color={theme.primary} />;
  if (!habit) return null;

  return (
    <ThemedView style={{ flex: 1 }}>
      {(save.error || archive.error) && (
        <ThemedText type="small" style={{ color: theme.danger, padding: 16 }}>
          {t('common.error')}
        </ThemedText>
      )}
      <HabitForm
        key={habit.id}
        habit={habit}
        submitting={save.isPending}
        onSubmit={(input) => save.mutate({ ...input, id: habit.id }, { onSuccess: () => router.back() })}
        onArchive={() =>
          confirm(
            t('habit.deleteConfirm'),
            () => archive.mutate(habit.id, { onSuccess: () => router.back() }),
            { ok: t('common.delete'), cancel: t('common.cancel') },
          )
        }
      />
    </ThemedView>
  );
}
