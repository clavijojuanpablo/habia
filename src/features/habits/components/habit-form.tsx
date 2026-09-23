import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Stepper } from '@/components/stepper';
import { TextField } from '@/components/text-field';
import { TimePicker } from '@/components/time-picker';
import { ThemedText } from '@/components/themed-text';
import { HabitColors, MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { identityEmoji, useIdentities } from '@/features/identities/api';
import { REMINDERS_SUPPORTED } from '@/features/reminders/notifications';
import { useTheme } from '@/hooks/use-theme';
import { parseRRule, toRRule, WEEKDAYS, type Frequency, type Weekday } from '@/lib/recurrence';
import { formatTimeLabel } from '@/lib/time/format';

import { useHabits, type Habit, type HabitInput } from '../api';
import { wouldCreateCycle } from '../stacking';

const EMOJIS = [
  '💧', '📚', '🧘', '🏃', '💪', '🥗', '😴', '🦷', '🧴', '☕', '✍️', '🎸',
  '🎨', '🧠', '💊', '🚶', '🚴', '🏊', '🙏', '🌱', '📵', '🧹', '💻', '📝',
  '🎯', '❤️', '🌞', '🌙', '🍎', '🛏️', '🗣️', '💰',
];

type FrequencyKind = Frequency['kind'];
const FREQUENCY_KINDS: FrequencyKind[] = ['daily', 'interval_days', 'weekdays', 'interval_hours'];
/** Minutes before the occurrence; null = no reminder. */
const REMINDER_OPTIONS: (number | null)[] = [null, 0, 5, 15, 30];
type CueType = Habit['cue_type'];
const CUE_TYPES: CueType[] = ['time', 'after_habit', 'context'];

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
  const { t, i18n } = useTranslation();
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
  const [cueType, setCueType] = useState<CueType>(habit?.cue_type ?? 'time');
  const [anchorId, setAnchorId] = useState<string | null>(habit?.anchor_habit_id ?? null);
  const [contextLabel, setContextLabel] = useState(habit?.context_label ?? '');
  const [identityId, setIdentityId] = useState<string | null>(habit?.identity_id ?? null);
  const [temptation, setTemptation] = useState(habit?.temptation_bundle ?? '');
  const [showExtras, setShowExtras] = useState(
    !!habit?.two_minute_version || !!habit?.implementation_intention || !!habit?.temptation_bundle,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: allHabits = [] } = useHabits();
  const { data: identities = [] } = useIdentities();
  // Possible anchors: any other active habit that would not close a loop.
  const anchorOptions = allHabits.filter((h) => h.id !== habit?.id && !wouldCreateCycle(allHabits, habit?.id, h.id));

  const stacked = cueType === 'after_habit';
  const hourly = kind === 'interval_hours';
  const hasTime = !stacked && (!!time || hourly);

  const submit = () => {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = t('habit.nameRequired');
    if (kind === 'weekdays' && days.length === 0) next.days = t('habit.daysRequired');
    if (stacked && !anchorId) next.anchor = t('habit.anchorRequired');
    if (cueType === 'context' && !contextLabel.trim()) next.context = t('habit.contextRequired');
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
      // A stacked habit has no clock time of its own: it happens right after its anchor.
      window_start: stacked ? null : toDbTime(time),
      window_end: hourly && !stacked ? toDbTime(windowEnd) : null,
      two_minute_version: twoMinute.trim() || null,
      implementation_intention: intention.trim() || null,
      // Reminders only apply to timed occurrences.
      reminder_minutes_before: hasTime ? reminder : null,
      cue_type: cueType,
      anchor_habit_id: stacked ? anchorId : null,
      context_label: cueType === 'context' ? contextLabel.trim() : null,
      identity_id: identityId,
      temptation_bundle: temptation.trim() || null,
    });
  };

  const previewSubtitle = stacked
    ? t('habit.cueType.after_habit')
    : cueType === 'context' && contextLabel
      ? `📍 ${contextLabel}`
      : time
        ? formatTimeLabel(time, i18n.language)
        : t('bands.anytime');

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Preview icon={icon} color={color} name={name.trim() || t('habit.namePreview')} subtitle={previewSubtitle} />

      <Section title={t('habit.name')}>
        <TextField
          placeholder={t('habit.namePlaceholder')}
          value={name}
          onChangeText={setName}
          error={errors.name}
          autoFocus={!habit}
          maxLength={80}
        />
      </Section>

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
          {FREQUENCY_KINDS.filter((k) => !(stacked && k === 'interval_hours')).map((k) => (
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

      {/* Identity: which part of "who you want to be" this habit votes for */}
      <Section title={`${t('habit.identity')} (${t('common.optional')})`}>
        <View style={styles.wrap}>
          <Chip
            label={t('habit.identityNone')}
            selected={identityId === null}
            color={color}
            onPress={() => setIdentityId(null)}
          />
          {identities.map((identity) => (
            <Chip
              key={identity.id}
              label={`${identityEmoji(identity)} ${identity.statement}`}
              selected={identityId === identity.id}
              color={color}
              onPress={() => setIdentityId(identity.id)}
            />
          ))}
          <Chip label={`+ ${t('identity.new')}`} selected={false} color={color} onPress={() => router.push('/identity/new')} />
        </View>
      </Section>

      {/* Cue: the first law, "make it obvious" */}
      <Section title={t('habit.cue')}>
        <View style={styles.wrap}>
          {CUE_TYPES.map((c) => (
            <Chip
              key={c}
              label={t(`habit.cueType.${c}`)}
              selected={cueType === c}
              color={color}
              onPress={() => {
                setCueType(c);
                // An hourly habit cannot also be "right after" another habit.
                if (c === 'after_habit' && kind === 'interval_hours') setKind('daily');
              }}
            />
          ))}
        </View>

        {stacked && (
          <>
            <ThemedText type="small" themeColor="textSecondary">
              {t('habit.anchorHint')}
            </ThemedText>
            {anchorOptions.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
                {t('habit.noAnchors')}
              </ThemedText>
            ) : (
              <View style={styles.wrap}>
                {anchorOptions.map((h) => (
                  <Chip
                    key={h.id}
                    label={`${h.icon} ${h.name}`}
                    selected={anchorId === h.id}
                    color={color}
                    onPress={() => setAnchorId(h.id)}
                  />
                ))}
              </View>
            )}
            {errors.anchor && (
              <ThemedText type="small" style={{ color: theme.danger }}>
                {errors.anchor}
              </ThemedText>
            )}
          </>
        )}

        {cueType === 'context' && (
          <TextField
            placeholder={t('habit.contextPlaceholder')}
            hint={t('habit.contextHint')}
            value={contextLabel}
            onChangeText={setContextLabel}
            error={errors.context}
          />
        )}
      </Section>

      {!stacked && (
        <Section title={hourly ? t('habit.window') : t('habit.time')}>
        <View style={styles.row}>
          <View style={styles.flex}>
            <TimePicker label={hourly ? t('habit.windowStart') : undefined} value={time} onChange={setTime} />
          </View>
          {hourly && (
            <View style={styles.flex}>
              <TimePicker label={t('habit.windowEnd')} value={windowEnd} onChange={setWindowEnd} clearable={false} />
            </View>
          )}
        </View>
        {!hourly && (
          <ThemedText type="small" themeColor="textSecondary">
            {t('habit.timeHint')}
          </ThemedText>
        )}
        </Section>
      )}

      {hasTime && (
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

      {/* Optional science extras, hidden by default so the form is not overwhelming */}
      <Pressable
        onPress={() => setShowExtras(!showExtras)}
        accessibilityRole="button"
        accessibilityState={{ expanded: showExtras }}
        style={[styles.disclosure, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText type="heading" style={styles.flex}>
          {t('habit.moreOptions')}
        </ThemedText>
        <ThemedText type="heading" themeColor="textSecondary">
          {showExtras ? '▾' : '▸'}
        </ThemedText>
      </Pressable>

      {showExtras && (
        <Section title={t('habit.extrasTitle')}>
          <TextField
            label={t('habit.twoMinute')}
            hint={t('habit.twoMinuteHint')}
            placeholder={t('habit.twoMinutePlaceholder')}
            value={twoMinute}
            onChangeText={setTwoMinute}
          />
          <TextField
            label={t('habit.intention')}
            hint={t('habit.intentionHint')}
            placeholder={t('habit.intentionPlaceholder')}
            value={intention}
            onChangeText={setIntention}
            multiline
          />
          <TextField
            label={t('habit.temptation')}
            hint={t('habit.temptationHint')}
            placeholder={t('habit.temptationPlaceholder')}
            value={temptation}
            onChangeText={setTemptation}
          />
        </Section>
      )}

      {onArchive && <Button label={t('common.delete')} variant="danger" onPress={onArchive} />}
        </ScrollView>

        {/* Save always reachable, without scrolling to the bottom */}
        <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <Button label={t('common.save')} onPress={submit} loading={submitting} />
        </View>
      </View>
  );
}

/** Every group of fields is a white card, so the long form reads as steps. */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="heading">{title}</ThemedText>
      {children}
    </View>
  );
}

/** Live preview: the habit exactly as it will look in Today. */
function Preview({ icon, color, name, subtitle }: { icon: string; color: string; name: string; subtitle: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.preview, { backgroundColor: theme.backgroundElement }]}>
      <View style={[styles.previewIcon, { backgroundColor: color + '26' }]}>
        <ThemedText style={styles.previewEmoji}>{icon}</ThemedText>
      </View>
      <View style={styles.flex}>
        <ThemedText type="heading" numberOfLines={1}>
          {name}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {subtitle}
        </ThemedText>
      </View>
      <View style={[styles.previewCheck, { borderColor: color + '66', backgroundColor: color + '12' }]} />
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
  flex: { flex: 1 },
  container: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.five,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: { gap: Spacing.two, padding: Spacing.three, borderRadius: Radius.lg, boxShadow: Shadow.card },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    boxShadow: Shadow.card,
  },
  previewIcon: { width: 52, height: 52, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  previewEmoji: { fontSize: 26, lineHeight: 32 },
  previewCheck: { width: 40, height: 40, borderRadius: 20, borderWidth: 2.5 },
  disclosure: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Radius.lg,
    boxShadow: Shadow.card,
  },
  footer: {
    padding: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  weekdays: { flexDirection: 'row', justifyContent: 'space-between' },
  row: { flexDirection: 'row', gap: Spacing.three },
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
