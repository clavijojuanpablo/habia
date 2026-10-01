import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { ProgressRing } from '@/components/progress-ring';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { STREAK_MILESTONES } from '../compute-streak';
import { milestoneWindow } from '../milestone-window';

const NODE = 52;

/**
 * Streak goals as a horizontal timeline that shows only the nearby ones: the last reached, the
 * current goal (a ring with "12/14") and the next ones, joined by a line that fills as you go.
 */
export function MilestoneTimeline({ current }: { current: number }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { shown, target } = milestoneWindow(current, STREAK_MILESTONES);
  const goal = target === -1 ? null : shown[target];
  const previous = target > 0 ? shown[target - 1] : 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {shown.map((m, i) => {
          const reached = current >= m;
          const isGoal = i === target;
          // The segment before each node fills when that node is reached, partly for the goal.
          const fill = reached ? 1 : isGoal ? Math.max(0, (current - previous) / (m - previous)) : 0;
          return (
            <View key={m} style={[styles.step, i > 0 && styles.grow]}>
              {i > 0 && (
                <View style={[styles.segment, { backgroundColor: theme.backgroundSelected }]}>
                  <View style={[styles.segmentFill, { width: `${fill * 100}%`, backgroundColor: theme.streak }]} />
                </View>
              )}
              <View style={styles.node}>
                {isGoal ? (
                  <ProgressRing
                    progress={Math.min(1, current / m)}
                    size={NODE + 8}
                    stroke={6}
                    color={theme.streak}
                    track={theme.backgroundSelected}>
                    <ThemedText style={[styles.number, { color: theme.streak }]}>{m}</ThemedText>
                  </ProgressRing>
                ) : (
                  <View
                    style={[
                      styles.circle,
                      {
                        backgroundColor: reached ? theme.streak : theme.backgroundSelected,
                        opacity: reached ? 1 : 0.7,
                      },
                    ]}>
                    <ThemedText style={[styles.number, { color: reached ? theme.onPrimary : theme.textSecondary }]}>
                      {reached ? '🏅' : m}
                    </ThemedText>
                  </View>
                )}
                <ThemedText
                  type="caption"
                  numberOfLines={1}
                  style={{ color: isGoal ? theme.streak : theme.textSecondary }}>
                  {isGoal ? `${current}/${m}` : reached ? t('streak.dayCount', { count: m }) : `🔒 ${m}`}
                </ThemedText>
              </View>
            </View>
          );
        })}
      </View>
      {goal !== null && (
        <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
          {t('streak.toGoal', { count: goal - current, goal })}
        </ThemedText>
      )}
      {shown.includes(66) && (
        <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
          {t('streak.milestone66')}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  // Only steps with a segment grow: on web `flex: 0` collapses the first node to zero width.
  step: { flexDirection: 'row', alignItems: 'flex-start' },
  grow: { flex: 1 },
  segment: { flex: 1, height: 6, borderRadius: 3, marginTop: (NODE + 8) / 2 - 3, overflow: 'hidden' },
  segmentFill: { height: '100%', borderRadius: 3 },
  node: { width: NODE + 12, alignItems: 'center', gap: Spacing.one },
  circle: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  number: { fontSize: 18, lineHeight: 24, fontFamily: FontFamily.black },
  center: { textAlign: 'center' },
});
