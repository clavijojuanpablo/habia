import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { HabitColors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { IDENTITY_AREAS, type Identity, type IdentityArea, type IdentityInput } from '../api';

type Props = {
  identity?: Identity;
  submitting?: boolean;
  onSubmit: (input: IdentityInput) => void;
  onDelete?: () => void;
};

export function IdentityForm({ identity, submitting, onSubmit, onDelete }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [statement, setStatement] = useState(identity?.statement ?? '');
  const [area, setArea] = useState<IdentityArea>((identity?.area as IdentityArea) ?? 'health');
  const [color, setColor] = useState(identity?.color ?? HabitColors[0]);
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!statement.trim()) return setError(t('identity.statementRequired'));
    onSubmit({ statement: statement.trim(), area, color });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <ThemedText themeColor="textSecondary">{t('identity.explainer')}</ThemedText>

      <TextField
        label={t('identity.statement')}
        placeholder={t('identity.statementPlaceholder')}
        value={statement}
        onChangeText={setStatement}
        error={error}
        autoFocus={!identity}
        maxLength={80}
      />

      <View style={styles.section}>
        <ThemedText type="smallBold">{t('identity.area')}</ThemedText>
        <View style={styles.wrap}>
          {(Object.keys(IDENTITY_AREAS) as IdentityArea[]).map((a) => (
            <Pressable
              key={a}
              onPress={() => setArea(a)}
              accessibilityState={{ selected: area === a }}
              style={[styles.chip, { backgroundColor: area === a ? color : theme.backgroundElement }]}>
              <ThemedText type="smallBold" style={{ color: area === a ? '#fff' : theme.text }}>
                {IDENTITY_AREAS[a]} {t(`identity.areas.${a}`)}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold">{t('habit.color')}</ThemedText>
        <View style={styles.wrap}>
          {HabitColors.map((c) => (
            <Pressable
              key={c}
              onPress={() => setColor(c)}
              accessibilityLabel={c}
              style={[styles.swatch, { backgroundColor: c }, c === color && { borderColor: theme.text }]}
            />
          ))}
        </View>
      </View>

      <Button label={t('common.save')} onPress={submit} loading={submitting} />
      {onDelete && <Button label={t('common.delete')} variant="danger" onPress={onDelete} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.four },
  section: { gap: Spacing.two },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: 'transparent' },
});
