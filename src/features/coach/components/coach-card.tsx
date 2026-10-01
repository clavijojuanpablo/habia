import { router } from 'expo-router';
import type { TFunction } from 'i18next';
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

import type { CoachTip } from '../compute-tip';

type Props = {
  tip: CoachTip;
  /** Today's schedule: the "never miss twice" action checks one of these. */
  items: ScheduledItem[];
  onToggle: (item: ScheduledItem, status?: LogStatus) => void;
  onDismiss: () => void;
};

type Content = {
  text: string;
  mood: BroteMood;
  action?: { label: string; run: () => void };
};

/** The coach's daily tip, voiced by Brote, with at most one action a tap away. */
export function CoachCard({ tip, items, onToggle, onDismiss }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { data: habit } = useHabit('habitId' in tip ? tip.habitId : undefined);
  const { text, mood, action } = describe(tip, items, habit, onToggle, t);

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, boxShadow: Shadow.card }]}>
      <View style={styles.row}>
        <Brote mood={mood} size={56} />
        <ThemedText type="small" style={styles.text}>
          {text}
        </ThemedText>
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

function describe(
  tip: CoachTip,
  items: ScheduledItem[],
  habit: Habit | undefined,
  onToggle: Props['onToggle'],
  t: TFunction,
): Content {
  const editHabit = (id: string) => () => router.push({ pathname: '/habit/[id]', params: { id } });

  switch (tip.rule) {
    case 'never_miss_twice': {
      const own = items.filter((item) => item.habit.id === tip.habitId);
      const pending = own.find((item) => !isDone(item) && !isSkipped(item));
      if (!pending && own.some(isDone)) return { text: t('coach.neverMissTwice.done', tip), mood: 'celebrate' };
      return {
        text: t(tip.minimum ? 'coach.neverMissTwice.minimum' : 'coach.neverMissTwice.plain', tip),
        mood: 'cheer',
        action: pending && {
          label: t(tip.minimum ? 'coach.actions.doMinimum' : 'coach.actions.markDone'),
          run: () => onToggle(pending, tip.minimum ? 'done_minimum' : undefined),
        },
      };
    }
    case 'comeback':
      return { text: t('coach.comeback'), mood: 'cheer' };
    case 'automaticity':
      return {
        text: t(`coach.automaticity.${tip.stage}`, tip),
        mood: 'celebrate',
        action: {
          label: t('coach.actions.seeGarden'),
          run: () => router.push('/garden'),
        },
      };
    case 'add_minimum':
    case 'add_intention': {
      // The tip stays pinned all day: once the advice is taken, say so instead of asking again.
      const taken = tip.rule === 'add_minimum' ? habit?.two_minute_version : habit?.implementation_intention;
      if (taken)
        return {
          text: t(`coach.taken.${tip.rule === 'add_minimum' ? 'minimum' : 'intention'}`, tip),
          mood: 'celebrate',
        };
      return {
        text: t(tip.rule === 'add_minimum' ? 'coach.addMinimum' : 'coach.addIntention', tip),
        mood: 'happy',
        action: {
          label: t(tip.rule === 'add_minimum' ? 'coach.actions.addMinimum' : 'coach.actions.addIntention'),
          run: editHabit(tip.habitId),
        },
      };
    }
    case 'best_band':
      return {
        text: t('coach.bestBand', {
          ...tip,
          best: t(`bands.${tip.best}`),
          worst: t(`bands.${tip.worst}`),
        }),
        mood: 'happy',
      };
    case 'week_up':
      return { text: t('coach.weekUp', tip), mood: 'celebrate' };
    case 'fact':
      return { text: t(`coach.facts.${tip.index}`), mood: 'happy' };
  }
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Radius.lg, gap: Spacing.two },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  text: { flex: 1 },
});
