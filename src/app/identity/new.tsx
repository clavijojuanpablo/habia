import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useSaveIdentity } from '@/features/identities/api';
import { IdentityForm } from '@/features/identities/components/identity-form';
import { useTheme } from '@/hooks/use-theme';

export default function NewIdentityScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const save = useSaveIdentity();

  return (
    <ThemedView style={{ flex: 1 }}>
      {save.error && (
        <ThemedText type="small" style={{ color: theme.danger, padding: 16 }}>
          {t('common.error')}
        </ThemedText>
      )}
      <IdentityForm
        submitting={save.isPending}
        onSubmit={(input) => save.mutate(input, { onSuccess: () => router.back() })}
      />
    </ThemedView>
  );
}
