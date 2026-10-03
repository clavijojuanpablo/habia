import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Radius, Shadow, Spacing } from '@/constants/theme';
import { Brote } from '@/features/mascot/brote';
import { useNow } from '@/hooks/use-now';
import { useTheme } from '@/hooks/use-theme';
import { hapticLight } from '@/lib/haptics';
import { timeAgo, timeUntil } from '@/lib/time/relative';

import {
  CHEER_EMOJI,
  CHEER_GAP_MS,
  CHEER_KINDS,
  SocialError,
  useCheersInbox,
  useMarkCheersSeen,
  useRecentCheerTo,
  useSendCheer,
  type Cheer,
} from '../api';
import { useSocialRefresh } from '../use-social-refresh';
import { SocialAvatar } from './social-avatar';

/**
 * The five preset cheers. One per friend every 3 hours, whichever you pick: after sending, the
 * chosen one shows as given and the row says when the next one is possible.
 */
export function CheerRow({ toUser, name }: { toUser: string; name: string }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const send = useSendCheer();
  const recent = useRecentCheerTo(toUser);

  // Right after sending, until the refetch lands, the mutation itself says what was sent.
  const justSent = send.isSuccess ? send.variables : undefined;
  const sentKind = recent.data?.kind ?? justSent?.kind;
  const sentAt = recent.data ? new Date(recent.data.created_at) : justSent ? send.submittedAt : null;
  const nextAt = sentAt ? new Date(new Date(sentAt).getTime() + CHEER_GAP_MS) : null;
  const waiting = nextAt !== null && nextAt > now;
  const tooSoon = send.error instanceof SocialError && send.error.code === 'cheer_too_soon';

  return (
    <View style={styles.gap}>
      <View style={styles.cheerGrid}>
        {CHEER_KINDS.map((kind) => {
          const given = waiting && sentKind === kind;
          return (
            <Pressable
              key={kind}
              disabled={waiting || send.isPending}
              onPress={() => {
                hapticLight();
                send.mutate({ to_user: toUser, kind });
              }}
              accessibilityRole="button"
              accessibilityState={{ disabled: waiting, selected: given }}
              accessibilityLabel={t('social.cheer.sendTo', { cheer: t(`social.cheer.kinds.${kind}`), name })}
              style={({ pressed }) => [
                styles.cheer,
                {
                  backgroundColor: given ? theme.primarySoft : theme.background,
                  borderColor: given ? theme.primary : theme.border,
                  opacity: waiting && !given ? 0.45 : 1,
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
      </View>
      <ThemedText type="caption" themeColor="textSecondary" style={styles.center}>
        {waiting && nextAt
          ? t('social.cheer.nextIn', { name, when: untilText(t, nextAt, now) })
          : t('social.cheer.onePerGap')}
      </ThemedText>
      {send.isError && !tooSoon && (
        <ThemedText type="small" themeColor="danger">
          {t('social.errors.generic')}
        </ThemedText>
      )}
    </View>
  );
}

const untilText = (t: TFunction, target: Date, now: Date) => {
  const { key, count } = timeUntil(target, now);
  return t(`time.until.${key}`, { count });
};

/** "hace 5 min", "ayer"… for any past moment. */
export const agoText = (t: TFunction, then: Date, now: Date) => {
  const { key, count } = timeAgo(then, now);
  return t(`time.ago.${key}`, { count });
};

/** Answering a cheer happens on the sender's page, where the cheers are. */
const openSender = (cheer: Cheer) => router.push({ pathname: '/friend/[id]', params: { id: cheer.from_user } });

const cheerLine = (t: TFunction, cheer: Cheer) =>
  t(`social.cheer.received.${cheer.kind}`, { name: cheer.from?.display_name ?? '' });

/** Every cheer of the last two weeks, with when it came; new ones in bold. Pull to refresh. */
export function CheersList({ cheers, loading }: { cheers: Cheer[]; loading: boolean }) {
  const { t } = useTranslation();
  const theme = useTheme();
  const now = useNow();
  const { refreshing, onRefresh } = useSocialRefresh();

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}>
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : cheers.length === 0 ? (
        <View style={styles.empty}>
          <Brote mood="sleepy" size={88} />
          <ThemedText themeColor="textSecondary" style={styles.center}>
            {t('social.cheer.empty')}
          </ThemedText>
        </View>
      ) : (
        <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
          {cheers.map((cheer) => (
            <Pressable
              key={cheer.id}
              onPress={() => openSender(cheer)}
              accessibilityRole="button"
              style={({ pressed }) => [styles.inboxRow, { opacity: pressed ? 0.6 : 1 }]}>
              <SocialAvatar color={cheer.from?.color ?? theme.primary} size={44} />
              <View style={styles.flex}>
                <ThemedText type={cheer.seen_at ? 'small' : 'smallBold'}>
                  {CHEER_EMOJI[cheer.kind]} {cheerLine(t, cheer)}
                </ThemedText>
                <ThemedText type="caption" themeColor="textSecondary">
                  {agoText(t, new Date(cheer.created_at), now)}
                </ThemedText>
              </View>
              <ThemedText type="heading" themeColor="textSecondary">
                ›
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
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
              openSender(first);
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
  gap: { gap: Spacing.two },
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
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.six,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  card: { borderRadius: Radius.lg, padding: Spacing.three, gap: Spacing.three, boxShadow: Shadow.card },
  empty: { alignItems: 'center', gap: Spacing.three, paddingTop: Spacing.five },
  inboxRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
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
