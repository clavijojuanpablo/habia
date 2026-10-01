import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { SocialError, useJoinCircle, type Circle, type SocialProfile } from '../api';
import type { CircleWeekRow } from '../shared-days';
import { SocialAvatar } from './social-avatar';
import { SocialCard } from './social-card';
import { WeekDots } from './week-dots';

export const circleInviteLink = (code: string) => `https://habia.app/join/${code}`;

export function CircleCard({ circle, memberCount }: { circle: Circle; memberCount: number }) {
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
        <ThemedText type="caption" themeColor="textSecondary">
          {t('social.circle.members', { count: memberCount })}
        </ThemedText>
      </View>
      <ThemedText type="heading" themeColor="textSecondary">
        ›
      </ThemedText>
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

/** One row per member with this week's planted days; tapping a member opens their card. */
export function CircleWeekGrid({
  rows,
  profiles,
  me,
}: {
  rows: CircleWeekRow[];
  profiles: Record<string, SocialProfile>;
  me: string;
}) {
  const { t } = useTranslation();
  const theme = useTheme();
  return (
    <View style={styles.grid}>
      {rows.map((row, i) => {
        const profile = profiles[row.userId];
        return (
          <Pressable
            key={row.userId}
            disabled={!profile || row.userId === me}
            onPress={() => router.push({ pathname: '/friend/[id]', params: { id: row.userId } })}
            accessibilityRole="button"
            style={styles.member}>
            <View style={styles.memberName}>
              <SocialAvatar color={profile?.color ?? theme.textSecondary} size={32} />
              <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
                {row.userId === me ? t('social.circle.you') : (profile?.display_name ?? t('social.circle.hidden'))}
              </ThemedText>
            </View>
            <WeekDots states={row.days.map((d) => circleDot[d])} size={14} showLabels={i === rows.length - 1} />
          </Pressable>
        );
      })}
    </View>
  );
}

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
  grid: { gap: Spacing.three },
  member: { gap: Spacing.one },
  memberName: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
