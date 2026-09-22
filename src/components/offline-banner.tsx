import { onlineManager, useIsMutating } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
import { TOGGLE_LOG_KEY } from '@/features/checkins/mutations';
import { useTheme } from '@/hooks/use-theme';

/** Subscribes to TanStack Query's online state (no polling). */
export function useIsOnline() {
  return useSyncExternalStore(
    (listener) => onlineManager.subscribe(listener),
    () => onlineManager.isOnline(),
    () => true,
  );
}

/** Calm, non-alarming notice: nothing is lost while offline. */
export function OfflineBanner() {
  const { t } = useTranslation();
  const theme = useTheme();
  const online = useIsOnline();
  const pending = useIsMutating({ mutationKey: TOGGLE_LOG_KEY });

  if (online) return null;

  return (
    <View style={[styles.banner, { backgroundColor: theme.goldSoft }]}>
      <ThemedText type="caption" style={{ color: theme.text }}>
        {pending > 0 ? t('offline.pending', { count: pending }) : t('offline.title')}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
});
