import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useJoinCircle } from '@/features/social/api';
import { InviteLanding } from '@/features/social/components/invite-landing';

/** Opened from a circle invite link: https://habia.app/join/<code>. */
export default function JoinFromLinkScreen() {
  const { t } = useTranslation();
  const code = (useLocalSearchParams<{ code: string }>().code ?? '').toUpperCase();
  const join = useJoinCircle();

  return (
    <InviteLanding
      title={t('social.invite.joinTitle')}
      body={t('social.invite.joinBody')}
      actionLabel={t('social.circle.join')}
      onAction={() =>
        join.mutate(code, { onSuccess: (id) => router.replace({ pathname: '/circle/[id]', params: { id } }) })
      }
      pending={join.isPending}
      error={join.error}
    />
  );
}
