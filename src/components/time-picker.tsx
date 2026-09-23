import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatHour, formatTimeLabel } from '@/lib/time/format';

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MINUTES = [0, 15, 30, 45];

type Props = {
  /** Optional: omit it when the surrounding card already has a title. */
  label?: string;
  /** `HH:MM`, or empty for "any time". */
  value: string;
  onChange: (value: string) => void;
  /** Adds a "no particular time" option. */
  clearable?: boolean;
};

/**
 * Picks a time by tapping, never by typing: free text invites "7pm", "19",
 * "7:5"… and every one of those is a validation error waiting to happen.
 */
export function TimePicker({ label, value, onChange, clearable = true }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const [hour, minute] = value ? value.split(':').map(Number) : [null, null];

  const select = (h: number, m: number) => {
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  return (
    <View style={styles.container}>
      {label && <ThemedText type="smallBold">{label}</ThemedText>}
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={`${label ?? ''} ${value ? formatTimeLabel(value, i18n.language) : t('time.anyTime')}`}
        style={({ pressed }) => [
          styles.field,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
        ]}>
        <ThemedText type="heading" themeColor={value ? 'text' : 'textSecondary'}>
          {value ? formatTimeLabel(value, i18n.language) : t('time.anyTime')}
        </ThemedText>
        <ThemedText type="heading" themeColor="textSecondary">
          🕐
        </ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} accessibilityLabel={t('common.close')} />
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <ThemedText type="heading" style={styles.center}>
            {label ?? t('habit.time')}
          </ThemedText>

          <View style={styles.columns}>
            <Column title={t('time.hour')}>
              {HOURS.map((h) => (
                <Option
                  key={h}
                  label={formatHour(h, i18n.language)}
                  selected={hour === h}
                  onPress={() => select(h, minute ?? 0)}
                />
              ))}
            </Column>
            <Column title={t('time.minutes')}>
              {MINUTES.map((m) => (
                <Option
                  key={m}
                  label={`:${String(m).padStart(2, '0')}`}
                  selected={minute === m}
                  onPress={() => select(hour ?? 8, m)}
                />
              ))}
            </Column>
          </View>

          <View style={styles.actions}>
            {clearable && (
              <Button
                label={t('time.anyTime')}
                variant="secondary"
                onPress={() => {
                  onChange('');
                  setOpen(false);
                }}
              />
            )}
            <Button label={t('common.save')} onPress={() => setOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.column}>
      <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
        {title}
      </ThemedText>
      <ScrollView contentContainerStyle={styles.list}>{children}</ScrollView>
    </View>
  );
}

function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.option, { backgroundColor: selected ? theme.primary : theme.backgroundElement }]}>
      <ThemedText type="smallBold" style={{ color: selected ? theme.onPrimary : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.one },
  center: { textAlign: 'center' },
  field: {
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(20,16,28,0.4)' },
  sheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.three,
    gap: Spacing.three,
    boxShadow: Shadow.raised,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  columns: { flexDirection: 'row', gap: Spacing.three, height: 260 },
  column: { flex: 1, gap: Spacing.one },
  list: { gap: Spacing.one, paddingBottom: Spacing.two },
  option: { paddingVertical: Spacing.two, borderRadius: Radius.sm, alignItems: 'center' },
  actions: { gap: Spacing.two, paddingBottom: Spacing.three },
});
