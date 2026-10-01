import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';
import { hapticSuccess } from '@/lib/haptics';

const SCALE = [
  { score: 1, emoji: '😞' },
  { score: 2, emoji: '🙁' },
  { score: 3, emoji: '😐' },
  { score: 4, emoji: '🙂' },
  { score: 5, emoji: '😄' },
];

type Props = {
  thanks: boolean;
  onAnswer: (score: number) => void;
  onSnooze: () => void;
};

/** One tap on a 1–5 face answers "is habia helping you improve your daily life?" */
export function NorthStarCard({ thanks, onAnswer, onSnooze }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (thanks)
    return (
      <View style={[styles.card, styles.row, { backgroundColor: theme.backgroundElement, boxShadow: Shadow.card }]}>
        <Brote mood="celebrate" size={40} />
        <ThemedText type="small" style={styles.flex}>
          {t('northStar.thanks')}
        </ThemedText>
      </View>
    );

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, boxShadow: Shadow.card }]}>
      <View style={styles.row}>
        <Brote mood="happy" size={40} />
        <ThemedText type="smallBold" style={styles.flex}>
          {t('northStar.question')}
        </ThemedText>
      </View>
      <View style={styles.scale}>
        {SCALE.map(({ score, emoji }) => (
          <Pressable
            key={score}
            onPress={() => {
              hapticSuccess();
              onAnswer(score);
            }}
            accessibilityRole="button"
            accessibilityLabel={t(`northStar.scale.${score}`)}
            style={({ pressed }) => [
              styles.face,
              { backgroundColor: theme.background, transform: [{ scale: pressed ? 0.9 : 1 }] },
            ]}>
            <ThemedText style={styles.emoji}>{emoji}</ThemedText>
          </Pressable>
        ))}
      </View>
      <View style={styles.footer}>
        <ThemedText type="caption" themeColor="textSecondary">
          {t('northStar.scale.1')}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary">
          {t('northStar.scale.5')}
        </ThemedText>
      </View>
      <View style={styles.snooze}>
        <Pressable onPress={onSnooze} hitSlop={8} accessibilityRole="button">
          <ThemedText type="caption" style={{ color: theme.primary }}>
            {t('northStar.notNow')}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.three, borderRadius: Radius.lg, gap: Spacing.three },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
  scale: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.two },
  face: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: Radius.md },
  emoji: { fontSize: 28, lineHeight: 34 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -Spacing.two },
  snooze: { alignItems: 'flex-end' },
});
