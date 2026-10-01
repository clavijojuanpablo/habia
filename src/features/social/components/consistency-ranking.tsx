import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { SocialAvatar } from './social-avatar';

export type RankingRow = { userId: string; name: string; color: string; percent: number | null };

const MEDALS = ['🥇', '🥈', '🥉'];

/**
 * Consistency as a ranking: one row per person, best first, with a bar that grows in on mount.
 * Medals only for the top three; nobody is marked as last. `onPress` opens a person.
 */
export function ConsistencyRanking({ rows, onPress }: { rows: RankingRow[]; onPress?: (userId: string) => void }) {
  return (
    <View style={styles.list}>
      {rows.map((row, i) => (
        <Row key={row.userId} row={row} index={i} onPress={onPress} />
      ))}
    </View>
  );
}

function Row({ row, index, onPress }: { row: RankingRow; index: number; onPress?: (userId: string) => void }) {
  const theme = useTheme();
  const width = useSharedValue(0);
  const target = row.percent ?? 0;

  useEffect(() => {
    width.set(withDelay(index * 80, withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) })));
  }, [index, target, width]);
  const barStyle = useAnimatedStyle(() => ({ width: `${width.get()}%` }));

  return (
    <Pressable
      disabled={!onPress}
      onPress={() => onPress?.(row.userId)}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}>
      <ThemedText style={styles.rank}>{MEDALS[index] ?? `${index + 1}`}</ThemedText>
      <SocialAvatar color={row.color} size={32} />
      <View style={styles.flex}>
        <View style={styles.nameRow}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
            {row.name}
          </ThemedText>
          <ThemedText style={[styles.percent, { color: row.color }]}>
            {row.percent === null ? '–' : `${row.percent}%`}
          </ThemedText>
        </View>
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          <Animated.View style={[styles.fill, { backgroundColor: row.color }, barStyle]} />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rank: { width: 28, textAlign: 'center', fontSize: 18, lineHeight: 24, fontFamily: FontFamily.black },
  flex: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.one },
  percent: { fontSize: 15, lineHeight: 20, fontFamily: FontFamily.black },
  track: { height: 10, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.pill },
});
