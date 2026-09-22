import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Stepper } from '@/components/stepper';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { HabitColors, Spacing } from '@/constants/theme';
import { REMINDERS_SUPPORTED } from '@/features/reminders/notifications';
import { useTheme } from '@/hooks/use-theme';
import { parseRRule, toRRule, WEEKDAYS, type Frequency, type Weekday } from '@/lib/recurrence';

import type { Habit, HabitInput } from '../api';

const EMOJIS = [
  '💧', '📚', '🧘', '🏃', '💪', '🥗', '😴', '🦷', '🧴', '☕', '✍️', '🎸',
  '🎨', '🧠', '💊', '🚶', '🚴', '🏊', '🙏', '🌱', '📵', '🧹', '💻', '📝',
  '🎯', '❤️', '🌞', '🌙', '🍎', '🛏️', '🗣️', '💰',
];

type FrequencyKind = Frequency['kind'];
const FREQUENCY_KINDS: FrequencyKind[] = ['daily', 'interval_days', 'weekdays', 'interval_hours'];
/** Minutes before the occurrence; null = no reminder. */
const REMINDER_OPTIONS: (number | null)[] = [null, 0, 5, 15, 30];
const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/;

type Props = {
  habit?: Habit;
  submitting?: boolean;
  onSubmit: (input: HabitInput) => void;
  onArchive?: () => void;
};

function toTimeInput(value: string | null | undefined) {
  return value ? value.slice(0, 5) : '';
}

function toDbTime(value: string) {
  if (!value) return null;
  const [h, m] = value.split(':');
  return `${h.padStart(2, '0')}:${m}:00`;
}

export function HabitForm({ habit, submitting, onSubmit, onArchive }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const initial = habit ? parseRRule(habit.rrule) : ({ kind: 'daily' } as Frequency);

  const [name, setName] = useState(habit?.name ?? '');
  const [icon, setIcon] = useState(habit?.icon && habit.icon !== 'sparkles' ? habit.icon : EMOJIS[0]);
  const [color, setColor] = useState(habit?.color ?? HabitColors[0]);
  const [kind, setKind] = useState<FrequencyKind>(initial.kind);
  const [intervalDays, setIntervalDays] = useState(initial.kind === 'interval_days' ? initial.interval : 2);
  const [intervalHours, setIntervalHours] = useState(initial.kind === 'interval_hours' ? initial.interval : 3);
  const [days, setDays] = useState<Weekday[]>(initial.kind === 'weekdays' ? initial.days : ['TU', 'TH']);
  const [time, setTime] = useState(toTimeInput(habit?.window_start));
  const [windowEnd, setWindowEnd] = useState(toTimeInput(habit?.window_end));
  const [twoMinute, setTwoMinute] = useState(habit?.two_minute_version ?? '');
  const [intention, setIntention] = useState(habit?.implementation_intention ?? '');
  const [reminder, setReminder] = useState<number | null>(habit ? habit.reminder_minutes_before : 0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const hourly = kind === 'interval_hours';

  const submit = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t('habit.nameRequired');
    if (kind === 'weekdays' && days.length === 0) next.days = t('habit.daysRequired');
    if (time && !TIME_PATTERN.test(time)) next.time = t('habit.invalidTime');
    if (hourly && windowEnd && !TIME_PATTERN.test(windowEnd)) next.windowEnd = t('habit.invalidTime');
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const frequency: Frequency =
      kind === 'interval_days'
        ? { kind, interval: intervalDays }
        : kind === 'weekdays'
          ? { kind, days }
          : kind === 'interval_hours'
            ? { kind, interval: intervalHours }
            : { kind: 'daily' };

    onSubmit({
      name: name.trim(),
      icon,
      color,
      rrule: toRRule(frequency),
      window_start: toDbTime(time),
      window_end: hourly ? toDbTime(windowEnd) : null,
      two_minute_version: twoMinute.trim() || null,
      implementation_intention: intention.trim() || null,
      // Reminders only apply to timed occurrences.
      reminder_minutes_before: time || hourly ? reminder : null,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TextField
        label={t('habit.name')}
        placeholder={t('habit.namePlaceholder')}
        value={name}
        onChangeText={setName}
        error={errors.name}
        autoFocus={!habit}
        maxLength={80}
      />

      <Section title={t('habit.icon')}>
        <View style={styles.wrap}>
          {EMOJIS.map((emoji) => (
            <Pressable
              key={emoji}
              onPress={() => setIcon(emoji)}
              style={[
                styles.emoji,
                { backgroundColor: emoji === icon ? color + '33' : theme.backgroundElement },
                emoji === icon && { borderColor: color },
              ]}>
              <ThemedText style={styles.emojiText}>{emoji}</ThemedText>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title={t('habit.color')}>
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
      </Section>

      <Section title={t('habit.frequency')}>
        <View style={styles.wrap}>
          {FREQUENCY_KINDS.map((k) => (
            <Chip key={k} label={t(`habit.freq.${k}`)} selected={kind === k} color={color} onPress={() => setKind(k)} />
          ))}
        </View>

        {kind === 'interval_days' && (
          <Stepper
            label={t('habit.everyNDays', { count: intervalDays })}
            value={intervalDays}
            min={2}
            max={14}
            onChange={setIntervalDays}
          />
        )}
        {kind === 'weekdays' && (
          <>
            <View style={styles.weekdays}>
              {WEEKDAYS.map((d) => (
                <Chip
                  key={d}
                  label={t(`weekdays.${d}`)}
                  selected={days.includes(d)}
                  color={color}
                  round
                  onPress={() => setDays((cur) => (cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]))}
                />
              ))}
            </View>
            {errors.days && (
              <ThemedText type="small" style={{ color: theme.danger }}>
                {errors.days}
              </ThemedText>
            )}
          </>
        )}
        {hourly && (
          <Stepper
            label={t('habit.everyNHours', { count: intervalHours })}
            value={intervalHours}
            min={1}
            max={12}
            onChange={setIntervalHours}
          />
        )}
      </Section>

      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            label={hourly ? t('habit.windowStart') : t('habit.time')}
            placeholder="07:30"
            value={time}
            onChangeText={setTime}
            error={errors.time}
            keyboardType="numbers-and-punctuation"
            maxLength={5}
          />
        </View>
        {hourly && (
          <View style={styles.flex}>
            <TextField
              label={t('habit.windowEnd')}
              placeholder="21:00"
              value={windowEnd}
              onChangeText={setWindowEnd}
              error={errors.windowEnd}
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />
          </View>
        )}
      </View>
      {!hourly && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
          {t('habit.timeHint')}
        </ThemedText>
      )}

      {(time || hourly) && (
        <Section title={t('habit.reminder')}>
          <View style={styles.wrap}>
            {REMINDER_OPTIONS.map((option) => (
              <Chip
                key={String(option)}
                label={
                  option === null
                    ? t('habit.reminderNone')
                    : option === 0
                      ? t('habit.reminderAtTime')
                      : t('habit.reminderBefore', { count: option })
                }
                selected={reminder === option}
                color={color}
                onPress={() => setReminder(option)}
              />
            ))}
          </View>
          {!REMINDERS_SUPPORTED && reminder !== null && (
            <ThemedText type="small" themeColor="textSecondary">
              {t('habit.reminderWebHint')}
            </ThemedText>
          )}
        </Section>
      )}

      <TextField
        label={`${t('habit.twoMinute')} (${t('common.optional')})`}
        hint={t('habit.twoMinuteHint')}
        placeholder={t('habit.twoMinutePlaceholder')}
        value={twoMinute}
        onChangeText={setTwoMinute}
      />

      <TextField
        label={`${t('habit.intention')} (${t('common.optional')})`}
        hint={t('habit.intentionHint')}
        placeholder={t('habit.intentionPlaceholder')}
        value={intention}
        onChangeText={setIntention}
        multiline
      />

      <Button label={t('common.save')} onPress={submit} loading={submitting} />
      {onArchive && <Button label={t('common.delete')} variant="danger" onPress={onArchive} />}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold">{title}</ThemedText>
      {children}
    </View>
  );
}

function Chip({
  label,
  selected,
  color,
  round,
  onPress,
}: {
  label: string;
  selected: boolean;
  color: string;
  round?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        round && styles.chipRound,
        { backgroundColor: selected ? color : theme.backgroundElement },
      ]}>
      <ThemedText type="smallBold" style={{ color: selected ? '#fff' : theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}


const styles = StyleSheet.create({
  container: { padding: Spacing.four, gap: Spacing.four, paddingBottom: Spacing.six },
  section: { gap: Spacing.two },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  weekdays: { flexDirection: 'row', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: Spacing.three },
  flex: { flex: 1 },
  hint: { marginTop: -Spacing.three },
  emoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiText: { fontSize: 22, lineHeight: 28 },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 3, borderColor: 'transparent' },
  chip: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, borderRadius: 999 },
  chipRound: { width: 40, height: 40, paddingHorizontal: 0, alignItems: 'center', justifyContent: 'center' },
});
