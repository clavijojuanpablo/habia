import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import { useSchedule } from '@/features/schedule/use-schedule';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { addDays } from '@/lib/recurrence';

import {
  configureNotifications,
  ensureNotificationPermission,
  REMINDERS_SUPPORTED,
  replaceScheduledReminders,
} from './notifications';
import { planReminders } from './plan-reminders';

/** How far ahead reminders are scheduled; re-synced whenever habits or logs change. */
const HORIZON_DAYS = 3;

/**
 * Keeps the device's local notifications in sync with the next few days of
 * timed habits. Completing a habit cancels its pending reminder.
 */
export function useReminderSync() {
  const { t } = useTranslation();
  const now = useNow();
  const { today } = useTodayRange(now);
  const horizon = useMemo(() => addDays(today, HORIZON_DAYS), [today]);
  const { items, isReady } = useSchedule(today, horizon);
  const lastSignature = useRef<string | null>(null);
  // Denied permission: coming back to the app may follow a change in Settings, so try again then.
  const blocked = useRef(false);
  const [resumes, setResumes] = useState(0);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active' || !blocked.current) return;
      blocked.current = false;
      lastSignature.current = null;
      setResumes((n) => n + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    // Without real data (cache still restoring, failed fetch) an empty plan would cancel everything.
    if (!REMINDERS_SUPPORTED || !isReady) return;

    const reminders = planReminders(items, new Date()).map(({ item, fireAt }) => ({
      fireAt,
      habitId: item.habit.id,
      title: `${item.habit.icon} ${item.habit.name}`,
      body: item.habit.implementation_intention
        ? t('reminders.bodyWhere', { where: item.habit.implementation_intention })
        : item.habit.two_minute_version
          ? t('reminders.bodyMinimum', { minimum: item.habit.two_minute_version })
          : t('reminders.body'),
    }));

    const signature = reminders.map((r) => `${r.habitId}|${r.fireAt.getTime()}|${r.title}|${r.body}`).join(';');
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;

    (async () => {
      await configureNotifications(t('reminders.channel'));
      if (reminders.length > 0 && !(await ensureNotificationPermission())) {
        // Not scheduled: let the next resume or change try again.
        blocked.current = true;
        lastSignature.current = null;
        return;
      }
      await replaceScheduledReminders(reminders);
    })().catch(() => {
      // Allow a retry on the next change.
      lastSignature.current = null;
    });
  }, [items, isReady, t, resumes]);
}
