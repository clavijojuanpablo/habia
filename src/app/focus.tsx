import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';

import { ThemedView } from '@/components/themed-view';
import { FocusSession } from '@/features/focus/components/focus-session';
import { useSchedule } from '@/features/schedule/use-schedule';
import { usePhotoCheckIn } from '@/features/social/use-photo-check-in';
import { addDays, startOfDay } from '@/lib/recurrence';

/** Focus mode for one of today's habits: `habitId` and its occurrence (`at`, ISO). */
export default function FocusScreen() {
  const { habitId, at } = useLocalSearchParams<{ habitId: string; at: string }>();
  // The occurrence's own day: a session started at 23:50 keeps its habit after midnight.
  const day = useMemo(() => startOfDay(new Date(at)), [at]);
  const next = useMemo(() => addDays(day, 1), [day]);
  const { items, isReady, toggleItem } = useSchedule(day, next);
  // A circle habit that asks for a photo still opens the camera when the timer plants it.
  const { withPhoto } = usePhotoCheckIn(items);
  const item = items.find((i) => i.habit.id === habitId && i.at.toISOString() === at);

  // The habit is gone (deleted or archived meanwhile): nothing to focus on.
  useEffect(() => {
    if (isReady && !item) router.back();
  }, [isReady, item]);

  return (
    <ThemedView style={{ flex: 1 }}>
      {item && (
        <FocusSession item={item} onCheckIn={(it, status) => withPhoto(it, status, () => toggleItem(it, status))} />
      )}
    </ThemedView>
  );
}
