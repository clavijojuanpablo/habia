import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { ThemedView } from '@/components/themed-view';
import { useCheersInbox, useMarkCheersSeen } from '@/features/social/api';
import { CheersList } from '@/features/social/components/cheers';

/** Cheers of the last two weeks, newest first. Opening it is reading them: they stop showing as new. */
export default function CheersScreen() {
  const cheers = useCheersInbox();
  const { mutate: markSeen } = useMarkCheersSeen();
  const hasUnseen = (cheers.data ?? []).some((c) => !c.seen_at);
  useFocusEffect(
    useCallback(() => {
      if (hasUnseen) markSeen();
    }, [hasUnseen, markSeen]),
  );

  return (
    <ThemedView style={{ flex: 1 }}>
      <CheersList cheers={cheers.data ?? []} loading={cheers.isLoading} />
    </ThemedView>
  );
}
