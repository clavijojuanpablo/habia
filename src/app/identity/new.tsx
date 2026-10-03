import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSaveIdentity } from '@/features/identities/api';
import { HabitPicker } from '@/features/identities/components/habit-picker';
import { IdentityForm } from '@/features/identities/components/identity-form';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';

/** A new branch, and in the same step the existing habits that will make it grow. */
export default function NewIdentityScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const save = useSaveIdentity();
  const [habitIds, setHabitIds] = useState<string[]>([]);

  return (
    <ThemedView style={{ flex: 1 }}>
      {save.error && (
        <ThemedText type="small" style={{ color: theme.danger, padding: 16 }}>
          {t('common.error')}
        </ThemedText>
      )}
      <IdentityForm
        submitting={save.isPending}
        onSubmit={(input) =>
          save.mutate(
            { ...input, habitIds },
            {
              onSuccess: () => {
                if (habitIds.length > 0) track('habit_branch_assigned', { count: habitIds.length });
                router.back();
              },
            },
          )
        }>
        <HabitPicker selected={habitIds} onChange={setHabitIds} />
      </IdentityForm>
    </ThemedView>
  );
}
