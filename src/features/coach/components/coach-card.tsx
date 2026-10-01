import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import type { LogStatus } from '@/features/checkins/api';
import { type Habit, useHabit } from '@/features/habits/api';
import { Brote, type BroteMood } from '@/features/mascot/brote';
import { isDone, isSkipped, type ScheduledItem } from '@/features/schedule/build-schedule';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';
import { parseLocalDate } from '@/lib/recurrence';

import type { CoachRule, CoachTip } from '../types';

type Props = {
  tip: CoachTip;
  /** Today's schedule: tips about a habit due today act on one of these. */
  items: ScheduledItem[];
  onToggle: (item: ScheduledItem, status?: LogStatus) => void;
  onDismiss: () => void;
};

type Content = { text: string; mood: BroteMood; action?: { label: string; run: () => void } };

/** i18n key per rule (`coach.<key>` for the message, `coach.why.<key>` for the explanation). */
const I18N_KEY: Record<CoachRule, string> = {
  never_miss_twice: 'neverMissTwice',
  comeback: 'comeback',
  usual_time: 'usualTime',
  weak_weekday: 'weakWeekday',
  automaticity: 'automaticity',
  add_minimum: 'addMinimum',
  add_intention: 'addIntention',
  week_up: 'weekUp',
  projection: 'projection',
  agenda: 'agenda',
  best_band: 'bestBand',
  minimum_saved: 'minimumSaved',
  fact: 'fact',
};

/** The coach's tip, voiced by Brote: one action a tap away and a "¿Por qué?" with the data behind it. */
export function CoachCard({ tip, items, onToggle, onDismiss }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const [whyOpen, setWhyOpen] = useState(false);
  const { data: habit } = useHabit('habitId' in tip ? tip.habitId : undefined);
  const { text, mood, action } = describe(tip, items, habit, onToggle, t, i18n.language);

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, boxShadow: Shadow.card }]}>
      <View style={styles.row}>
        <Brote mood={mood} size={56} />
        <View style={styles.body}>
          <ThemedText type="small">{text}</ThemedText>
          {whyOpen ? (
            <ThemedText type="caption" themeColor="textSecondary">
              {t(`coach.why.${I18N_KEY[tip.rule]}`, whyParams(tip, t, i18n.language))}
            </ThemedText>
          ) : (
            <Pressable
              onPress={() => {
                setWhyOpen(true);
                track('coach_why_opened', { rule: tip.rule });
              }}
              hitSlop={8}
              accessibilityRole="button">
              <ThemedText type="caption" style={{ color: theme.primary }}>
                {t('coach.whyLink')}
              </ThemedText>
            </Pressable>
          )}
        </View>
        <Pressable onPress={onDismiss} hitSlop={12} accessibilityRole="button" accessibilityLabel={t('common.close')}>
          <ThemedText type="heading" themeColor="textSecondary">
            ×
          </ThemedText>
        </Pressable>
      </View>
      {action && (
        <Button
          label={action.label}
          variant="secondary"
          onPress={() => {
            track('coach_tip_action', { rule: tip.rule });
            action.run();
          }}
        />
      )}
    </View>
  );
}

const formatTime = (minutes: number, lang: string) =>
  new Date(2000, 0, 1, Math.floor(minutes / 60), minutes % 60).toLocaleTimeString(lang, {
    hour: 'numeric',
    minute: '2-digit',
  });
const weekdayName = (lang: string) => new Date().toLocaleDateString(lang, { weekday: 'long' });

/** Interpolation values for the "¿Por qué?" line: the tip's numbers, with names localized. */
function whyParams(tip: CoachTip, t: TFunction, lang: string) {
  switch (tip.rule) {
    case 'weak_weekday':
      return { ...tip, weekday: weekdayName(lang) };
    case 'agenda':
      return { ...tip, band: t(`bands.${tip.band}`) };
    default:
      return tip;
  }
}

function describe(
  tip: CoachTip,
  items: ScheduledItem[],
  habit: Habit | undefined,
  onToggle: Props['onToggle'],
  t: TFunction,
  lang: string,
): Content {
  const v = `v${tip.variant}`;
  const editHabit = (id: string) => () => router.push({ pathname: '/habit/[id]', params: { id } });

  /** For tips about a habit due today: its pending occurrence, or a "done" message once checked. */
  const today = (habitId: string, minimum: string | null) => {
    const own = items.filter((item) => item.habit.id === habitId);
    const pending = own.find((item) => !isDone(item) && !isSkipped(item));
    const done = !pending && own.some(isDone);
    const action = pending && {
      label: t(minimum ? 'coach.actions.doMinimum' : 'coach.actions.markDone'),
      run: () => onToggle(pending, minimum ? 'done_minimum' : undefined),
    };
    return { done, action };
  };

  switch (tip.rule) {
    case 'never_miss_twice': {
      const { done, action } = today(tip.habitId, tip.minimum);
      if (done) return { text: t(`coach.neverMissTwice.done.${v}`, tip), mood: 'celebrate' };
      const message = t(`coach.neverMissTwice.${tip.minimum ? 'minimum' : 'plain'}.${v}`, tip);
      const history = tip.comebacks >= 2 ? ` ${t('coach.neverMissTwice.comebacks', { count: tip.comebacks })}` : '';
      return { text: message + history, mood: 'cheer', action };
    }
    case 'usual_time':
    case 'weak_weekday': {
      const minimum = tip.rule === 'weak_weekday' ? tip.minimum : null;
      const { done, action } = today(tip.habitId, minimum);
      if (done) return { text: t(`coach.doneToday.${v}`, tip), mood: 'celebrate' };
      const params =
        tip.rule === 'usual_time'
          ? { ...tip, time: formatTime(tip.minutes, lang) }
          : { ...tip, weekday: weekdayName(lang) };
      return { text: t(`coach.${I18N_KEY[tip.rule]}.${v}`, params), mood: 'cheer', action };
    }
    case 'comeback':
      return { text: t(`coach.comeback.${v}`), mood: 'cheer' };
    case 'automaticity':
      return {
        text: t(`coach.automaticity.${tip.stage}.${v}`, tip),
        mood: 'celebrate',
        action: { label: t('coach.actions.seeGarden'), run: () => router.push('/garden') },
      };
    case 'add_minimum':
    case 'add_intention': {
      // The tip stays pinned: once the advice is taken, say so instead of asking again.
      const taken = tip.rule === 'add_minimum' ? habit?.two_minute_version : habit?.implementation_intention;
      if (taken)
        return {
          text: t(`coach.taken.${tip.rule === 'add_minimum' ? 'minimum' : 'intention'}`, tip),
          mood: 'celebrate',
        };
      return {
        text: t(`coach.${I18N_KEY[tip.rule]}.${v}`, tip),
        mood: 'happy',
        action: {
          label: t(tip.rule === 'add_minimum' ? 'coach.actions.addMinimum' : 'coach.actions.addIntention'),
          run: editHabit(tip.habitId),
        },
      };
    }
    case 'projection':
      return {
        text: t(`coach.projection.${v}`, {
          ...tip,
          date: parseLocalDate(tip.eta).toLocaleDateString(lang, { day: 'numeric', month: 'long' }),
        }),
        mood: 'happy',
        action: { label: t('coach.actions.seeGarden'), run: () => router.push('/garden') },
      };
    case 'agenda':
      return { text: t(`coach.agenda.${v}`, { ...tip, band: t(`bands.${tip.band}`) }), mood: 'happy' };
    case 'best_band':
      return {
        text: t(`coach.bestBand.${v}`, { ...tip, best: t(`bands.${tip.best}`), worst: t(`bands.${tip.worst}`) }),
        mood: 'happy',
      };
    case 'minimum_saved':
      return { text: t(`coach.minimumSaved.${v}`, tip), mood: 'celebrate' };
    case 'week_up':
      return { text: t(`coach.weekUp.${v}`, tip), mood: 'celebrate' };
    case 'fact':
      return { text: t(`coach.facts.${tip.index}`), mood: 'happy' };
  }
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Radius.lg, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  body: { flex: 1, gap: Spacing.one },
});
