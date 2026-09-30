import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isAnalyticsEnabled, setAnalyticsEnabled } from '@/lib/analytics';

/** Usage analytics are on by default and one switch away from off: no dark patterns. */
export function AnalyticsToggle() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [enabled, setEnabled] = useState(isAnalyticsEnabled);

  const onChange = (value: boolean) => {
    setAnalyticsEnabled(value);
    setEnabled(value);
  };

  return (
    <View style={styles.row}>
      <View style={styles.texts}>
        <ThemedText type="heading">{t('profile.analytics')}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {t('profile.analyticsHint')}
        </ThemedText>
      </View>
      <Switch
        value={enabled}
        onValueChange={onChange}
        trackColor={{ true: theme.primary, false: theme.border }}
        accessibilityLabel={t('profile.analytics')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  texts: { flex: 1, gap: Spacing.one },
});
