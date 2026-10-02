import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/features/auth/session-provider';
import type { LogStatus } from '@/features/checkins/api';
import { isDone, type ScheduledItem } from '@/features/schedule/build-schedule';
import { showNotice } from '@/lib/confirm';
import { formatLocalDate } from '@/lib/recurrence';

import { enqueueHabitPhoto, takeHabitPhoto } from './photos';
import { useCircleHabits, useCircles } from './api';
import { useCircleHabitInfo } from './use-circle-habit-info';

/**
 * Every screen that checks habits goes through `withPhoto`: a circle's habit that asks for a photo
 * opens the camera first when checked for today (no photo, no check-in). The check-in itself is
 * immediate; the photo uploads in the background or waits in the on-device queue.
 */
export function usePhotoCheckIn(items: ScheduledItem[]) {
  const { t } = useTranslation();
  const { session } = useSession();
  const queryClient = useQueryClient();
  const linked = items.some((item) => item.habit.circle_habit_id);
  const circleInfo = useCircleHabitInfo(linked);
  // Same queries as inside useCircleHabitInfo (shared cache): tell "still loading" from "no photo".
  // isLoading, not isPending: offline with no cache a query stays pending but is not fetching.
  const habitsQuery = useCircleHabits(linked);
  const circlesQuery = useCircles(linked);
  const infoLoading = habitsQuery.isLoading || circlesQuery.isLoading;
  const userId = session?.user.id;

  const withPhoto = useCallback(
    (item: ScheduledItem, status: LogStatus | undefined, checkIn: () => void) => {
      const shared = item.habit.circle_habit_id ? circleInfo[item.habit.circle_habit_id] : undefined;
      const completing = status !== 'skipped' && !isDone(item);
      const today = formatLocalDate(new Date());
      // Without the circle's info we cannot know if a photo is due: wait rather than skip it.
      // (When it cannot load, e.g. offline with no cache, the check-in is let through.)
      if (completing && item.habit.circle_habit_id && !shared && infoLoading) {
        showNotice(t('photos.notReady'));
        return;
      }
      if (!completing || !shared?.photoRequired || !userId || formatLocalDate(item.at) !== today) {
        checkIn();
        return;
      }
      takeHabitPhoto()
        .then((photo) => {
          if (photo.status === 'denied') return showNotice(t('photos.cameraDenied'));
          if (photo.status !== 'ok') return;
          checkIn();
          return enqueueHabitPhoto({
            circleId: shared.circleId,
            circleHabitId: item.habit.circle_habit_id!,
            userId,
            day: today,
            base64: photo.base64,
          }).then((result) => {
            if (result === 'failed') showNotice(t('photos.notSent'));
            return queryClient.invalidateQueries({ queryKey: ['social'] });
          });
        })
        .catch(() => showNotice(t('photos.failed')));
    },
    [circleInfo, infoLoading, userId, t, queryClient],
  );

  return { circleInfo, withPhoto };
}
