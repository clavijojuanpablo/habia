import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { useNow, useTodayRange } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { hapticLight } from '@/lib/haptics';

import {
  CHEER_EMOJI,
  CHEER_KINDS,
  useCheersInbox,
  useMarkCheersSeen,
  useSendCheer,
  useSentCheersToday,
  type Cheer,
} from '../api';
import { SocialAvatar } from './social-avatar';
import { SocialCard } from './social-card';

/** The five preset cheers. One of each per person per day; the ones already sent show as given. */
export function CheerRow({ toUser, name }: { toUser: string; name: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const { today } = useTodayRange(now);
  const send = useSendCheer();
  const { data: sent = [] } = useSentCheersToday(toUser, today);

  return (
    <View style={styles.cheerGrid}>
      {CHEER_KINDS.map((kind) => {
        const given = sent.includes(kind) || (send.isSuccess && send.variables?.kind === kind);
        return (
          <Pressable
            key={kind}
            disabled={given || send.isPending}
            onPress={() => {
              hapticLight();
              send.mutate({ to_user: toUser, kind });
            }}
            accessibilityRole="button"
            accessibilityState={{ disabled: given }}
            accessibilityLabel={t('social.cheer.sendTo', { cheer: t(`social.cheer.kinds.${kind}`), name })}
            style={({ pressed }) => [
              styles.cheer,
              {
                backgroundColor: given ? theme.primarySoft : theme.background,
                borderColor: given ? theme.primary : theme.border,
                transform: [{ scale: pressed ? 0.95 : 1 }],
              },
            ]}>
            <ThemedText style={styles.cheerEmoji}>{given ? '✓' : CHEER_EMOJI[kind]}</ThemedText>
            <ThemedText type="caption" style={styles.center} numberOfLines={2}>
              {t(`social.cheer.kinds.${kind}`)}
            </ThemedText>
          </Pressable>
        );
      })}
      {send.isError && (
        <ThemedText type="small" themeColor="danger">
          {t('social.errors.generic')}
        </ThemedText>
      )}
    </View>
  );
}

const cheerLine = (t: TFunction, cheer: Cheer) =>
  t(`social.cheer.received.${cheer.kind}`, { name: cheer.from?.display_name ?? '' });

/** Cheers of the last two weeks on the Friends tab; opening it marks them seen. */
export function CheersInbox({ cheers }: { cheers: Cheer[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  if (cheers.length === 0) return null;
  return (
    <SocialCard>
      <ThemedText type="heading">💌 {t('social.cheer.inboxTitle')}</ThemedText>
      {cheers.slice(0, 8).map((cheer) => (
        <View key={cheer.id} style={styles.inboxRow}>
          <SocialAvatar color={cheer.from?.color ?? theme.primary} size={32} />
          <ThemedText type={cheer.seen_at ? 'small' : 'smallBold'} style={styles.flex}>
            {CHEER_EMOJI[cheer.kind]} {cheerLine(t, cheer)}
          </ThemedText>
        </View>
      ))}
    </SocialCard>
  );
}

/** Today's prompt slot: cheers that arrived since the last look, with a thank-you that clears them. */
export function CheersNotice({ cheers }: { cheers: Cheer[] }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const markSeen = useMarkCheersSeen();
  const first = cheers[0];
  return (
    <View style={[styles.notice, { backgroundColor: theme.backgroundElement, borderColor: theme.streak }]}>
      <Brote mood="celebrate" size={56} />
      <View style={styles.flex}>
        <ThemedText type="heading">
          {CHEER_EMOJI[first.kind]} {cheerLine(t, first)}
        </ThemedText>
        {cheers.length > 1 && (
          <ThemedText type="small" themeColor="textSecondary">
            {t('social.cheer.more', { count: cheers.length - 1 })}
          </ThemedText>
        )}
        <View style={styles.noticeActions}>
          <Button
            style={styles.flex}
            label={t('social.cheer.thanks')}
            loading={markSeen.isPending}
            onPress={() => markSeen.mutate()}
          />
          <Button
            style={styles.flex}
            variant="secondary"
            label={t('social.cheer.answer')}
            onPress={() => {
              markSeen.mutate();
              router.navigate('/profile');
            }}
          />
        </View>
      </View>
    </View>
  );
}

/** Unseen cheers, for Today's notice and the tab badge. */
export function useUnseenCheers() {
  const { data = [] } = useCheersInbox();
  return data.filter((c) => !c.seen_at);
}

const styles = StyleSheet.create({
  cheerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  cheer: {
    flexGrow: 1,
    flexBasis: '30%',
    alignItems: 'center',
    gap: Spacing.one,
    padding: Spacing.two,
    borderRadius: Radius.md,
    borderWidth: 2,
  },
  cheerEmoji: { fontSize: 26, lineHeight: 32 },
  center: { textAlign: 'center' },
  inboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
  notice: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.lg,
    borderWidth: 2,
    boxShadow: Shadow.card,
  },
  noticeActions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
});
