import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useSendFriendRequest } from '@/features/social/api';
import { InviteLanding } from '@/features/social/components/invite-landing';
import { normalizeUsername } from '@/features/social/username';

/** Opened from a friend's invite link: https://habia.app/add/<username>. */
export default function AddFromLinkScreen() {
  const { t } = useTranslation();
  const username = normalizeUsername(useLocalSearchParams<{ username: string }>().username ?? '');
  const send = useSendFriendRequest();

  return (
    <InviteLanding
      title={t('social.invite.addTitle', { username })}
      body={t('social.invite.addBody')}
      actionLabel={t('social.add.send')}
      onAction={() => send.mutate(username)}
      pending={send.isPending}
      error={send.error}
      done={send.data ? t(`social.add.result.${send.data}`) : null}
    />
  );
}
