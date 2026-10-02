import { useLocalSearchParams } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { Paywall } from '@/features/paywall/components/paywall';

/** habia Pro. `source` says where it was opened from (settings, habit limit…), for analytics. */
export default function PaywallScreen() {
  const { source } = useLocalSearchParams<{ source?: string }>();
  return (
    <ThemedView style={{ flex: 1 }}>
      <Paywall source={source ?? 'unknown'} />
    </ThemedView>
  );
}
