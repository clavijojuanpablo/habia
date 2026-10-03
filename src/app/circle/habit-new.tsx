import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { SocialError, useStartCircleHabit } from '@/features/social/api';
import {
  CircleHabitFields,
  circleHabitInput,
  circleHabitValid,
  EMPTY_CIRCLE_HABIT,
} from '@/features/social/components/circle-habit-fields';

/** A circle without its habit (its habit was ended): the owner picks the next one, and is in it. */
export default function NewCircleHabitScreen() {
  const { t } = useTranslation();
  const { circleId } = useLocalSearchParams<{ circleId: string }>();
  const start = useStartCircleHabit();
  const [draft, setDraft] = useState(EMPTY_CIRCLE_HABIT);
  const errorCode = start.error instanceof SocialError ? start.error.code : start.error ? 'generic' : null;

  return (
    <ThemedView style={styles.flex}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ThemedText type="small" themeColor="textSecondary">
          {t('social.circleHabit.newHint')}
        </ThemedText>
        <CircleHabitFields value={draft} onChange={setDraft} />
        {errorCode && (
          <ThemedText type="small" themeColor="danger">
            {t(`social.errors.${errorCode}`)}
          </ThemedText>
        )}
        <Button
          label={t('social.circleHabit.create')}
          disabled={!circleHabitValid(draft)}
          loading={start.isPending}
          onPress={() => start.mutate({ circleId, ...circleHabitInput(draft) }, { onSuccess: () => router.back() })}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});
