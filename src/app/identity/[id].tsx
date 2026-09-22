import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useDeleteIdentity, useIdentities, useSaveIdentity } from '@/features/identities/api';
import { IdentityForm } from '@/features/identities/components/identity-form';
import { useTheme } from '@/hooks/use-theme';
import { confirmAction } from '@/lib/confirm';

export default function EditIdentityScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: identities } = useIdentities();
  const identity = identities?.find((i) => i.id === id);
  const save = useSaveIdentity();
  const remove = useDeleteIdentity();

  if (!identity) return null;

  return (
    <ThemedView style={{ flex: 1 }}>
      {(save.error || remove.error) && (
        <ThemedText type="small" style={{ color: theme.danger, padding: 16 }}>
          {t('common.error')}
        </ThemedText>
      )}
      <IdentityForm
        key={identity.id}
        identity={identity}
        submitting={save.isPending}
        onSubmit={(input) => save.mutate({ ...input, id: identity.id }, { onSuccess: () => router.back() })}
        onDelete={() =>
          confirmAction(
            t('identity.deleteConfirm'),
            () => remove.mutate(identity.id, { onSuccess: () => router.back() }),
            { ok: t('common.delete'), cancel: t('common.cancel') },
          )
        }
      />
    </ThemedView>
  );
}
