import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * One settings row: a short title and its switch. The explanation stays one tap away (ⓘ), so the
 * screen reads as a list, not a wall of text.
 */
export function SettingSwitch({
  title,
  hint,
  value,
  onValueChange,
}: {
  title: string;
  hint: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Pressable
          onPress={() => setOpen(!open)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          accessibilityHint={t('common.moreInfo')}
          style={styles.title}>
          <ThemedText type="smallBold" style={styles.flex}>
            {title}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            ⓘ
          </ThemedText>
        </Pressable>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ true: theme.primary, false: theme.border }}
          accessibilityLabel={title}
        />
      </View>
      {open && (
        <ThemedText type="caption" themeColor="textSecondary">
          {hint}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  title: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flexShrink: 1 },
});
