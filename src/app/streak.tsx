import { router } from 'expo-router';

import { StreakView } from '@/features/streak/components/streak-view';
import { useStreak } from '@/features/streak/use-streak';
import { useNow, useTodayRange } from '@/hooks/use-now';

export default function StreakScreen() {
  const now = useNow();
  const { today } = useTodayRange(now);
  const { streak } = useStreak(today);

  return <StreakView streak={streak} onClose={() => router.back()} />;
}
