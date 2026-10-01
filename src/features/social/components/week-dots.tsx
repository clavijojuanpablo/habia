import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];

export type DotState = 'full' | 'half' | 'rest' | 'empty' | 'pending' | 'future';

/** Seven days, Monday first: full = planted (together), half = only one of two, rest = rest on purpose. */
export function WeekDots({
  states,
  size = 22,
  showLabels = true,
}: {
  states: DotState[];
  size?: number;
  showLabels?: boolean;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  const fill: Record<DotState, string> = {
    full: theme.primary,
    half: theme.primarySoft,
    rest: theme.lavenderSoft,
    empty: theme.backgroundSelected,
    pending: theme.background,
    future: theme.background,
  };
  return (
    <View style={styles.row}>
      {states.map((state, i) => (
        <View key={i} style={styles.day}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: fill[state],
              borderWidth: state === 'pending' ? 2 : state === 'half' ? 2 : 0,
              borderColor: state === 'pending' ? theme.border : theme.primary,
              borderStyle: state === 'pending' ? 'dashed' : 'solid',
            }}
          />
          {showLabels && (
            <ThemedText type="caption" themeColor="textSecondary">
              {t(`weekdays.${WEEKDAYS[i]}`)}
            </ThemedText>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.one },
  day: { alignItems: 'center', gap: Spacing.half },
});
