import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { deleteAccount } from '../api';

/**
 * Account deletion, required by the App Store for any app with sign-up.
 * Two guards: the user must type the confirmation word and then confirm again.
 */
export function DangerZone() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keyword = t('account.deleteKeyword');
  const confirmed = typed.trim().toUpperCase() === keyword.toUpperCase();

  const remove = async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteAccount();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('common.error'));
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { borderColor: theme.danger + '55' }]}>
      <ThemedText type="heading" style={{ color: theme.danger }}>
        {t('account.dangerZone')}
      </ThemedText>

      {!open ? (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {t('account.deleteHint')}
          </ThemedText>
          <Button label={t('account.deleteAccount')} variant="danger" onPress={() => setOpen(true)} />
        </>
      ) : (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {t('account.deleteWarning')}
          </ThemedText>
          <TextField
            label={t('account.typeToConfirm', { keyword })}
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="characters"
            autoCorrect={false}
            error={error}
          />
          <Button
            label={t('account.deleteForever')}
            variant="danger"
            disabled={!confirmed}
            loading={loading}
            onPress={remove}
          />
          <Button label={t('common.cancel')} variant="secondary" onPress={() => setOpen(false)} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.two, borderWidth: 2, borderRadius: Radius.lg, padding: Spacing.three },
});
