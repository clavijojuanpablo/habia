import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { FontFamily, Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { SocialError, useJoinCircle, type Circle } from '../api';
import { SocialCard } from './social-card';

export const circleInviteLink = (code: string) => `https://habia.app/join/${code}`;

/** `streak`: the main shared habit's group streak; the flame is lit once today is saved. */
export function CircleCard({
  circle,
  memberCount,
  streak,
}: {
  circle: Circle;
  memberCount: number;
  streak?: { count: number; lit: boolean; habit: string };
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/circle/[id]', params: { id: circle.id } })}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.backgroundElement, transform: [{ scale: pressed ? 0.98 : 1 }] },
      ]}>
      <View style={[styles.emojiTile, { backgroundColor: theme.lavenderSoft }]}>
        <ThemedText style={styles.emoji}>{circle.emoji}</ThemedText>
      </View>
      <View style={styles.flex}>
        <ThemedText type="heading" numberOfLines={1}>
          {circle.name}
        </ThemedText>
        <ThemedText type="caption" themeColor="textSecondary" numberOfLines={1}>
          {t('social.circle.members', { count: memberCount })}
          {streak ? ` · ${streak.habit}` : ''}
        </ThemedText>
      </View>
      {streak ? (
        <View
          accessibilityLabel={t('social.circleHabit.streakLabel', { count: streak.count })}
          style={[styles.streak, { backgroundColor: streak.lit ? theme.streakSoft : theme.backgroundSelected }]}>
          <ThemedText style={[styles.flame, !streak.lit && styles.dim]}>🔥</ThemedText>
          <ThemedText style={[styles.streakNumber, { color: streak.lit ? theme.streak : theme.textSecondary }]}>
            {streak.count}
          </ThemedText>
        </View>
      ) : (
        <ThemedText type="heading" themeColor="textSecondary">
          ›
        </ThemedText>
      )}
    </Pressable>
  );
}

/** Join with a code someone shared (the link does the same). Creating one is a separate screen. */
export function CirclesActions() {
  const { t } = useTranslation();
  const join = useJoinCircle();
  const [code, setCode] = useState('');
  const errorCode = join.error instanceof SocialError ? join.error.code : join.error ? 'generic' : null;
  const submit = () =>
    join.mutate(code, { onSuccess: (id) => router.push({ pathname: '/circle/[id]', params: { id } }) });

  return (
    <SocialCard>
      <ThemedText type="small" themeColor="textSecondary">
        {t('social.circle.intro')}
      </ThemedText>
      <Button label={t('social.circle.create')} onPress={() => router.push('/circle/new')} />
      <View style={styles.joinRow}>
        <View style={styles.flex}>
          <TextField
            placeholder={t('social.circle.codePlaceholder')}
            value={code}
            onChangeText={(text) => {
              setCode(
                text
                  .toUpperCase()
                  .replace(/[^A-Z0-9]/g, '')
                  .slice(0, 8),
              );
              join.reset();
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            onSubmitEditing={() => code.length === 8 && submit()}
          />
        </View>
        <Button
          variant="secondary"
          label={t('social.circle.join')}
          disabled={code.length !== 8}
          loading={join.isPending}
          onPress={submit}
        />
      </View>
      {errorCode && (
        <ThemedText type="small" themeColor="danger">
          {t(`social.errors.${errorCode}`)}
        </ThemedText>
      )}
    </SocialCard>
  );
}

export const circleDot = { active: 'full', rest: 'rest', empty: 'empty', future: 'future' } as const;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Radius.lg,
    padding: Spacing.three,
    boxShadow: Shadow.card,
  },
  emojiTile: { width: 48, height: 48, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 26, lineHeight: 32 },
  flex: { flex: 1 },
  joinRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.two },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  flame: { fontSize: 22, lineHeight: 28 },
  streakNumber: { fontSize: 22, lineHeight: 28, fontFamily: FontFamily.black },
  dim: { opacity: 0.35 },
});
