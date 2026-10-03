import { useTranslation } from 'react-i18next';

import { SettingSwitch } from '@/components/setting-switch';
import { useSession } from '@/features/auth/session-provider';
import { useProfile, useUpdateProfile } from '@/features/profile/api';
import { ensureNotificationPermission } from '@/features/reminders/notifications';

import { registerPushToken } from '../push-token';

/** Cheers, friend requests and circle nudges as pushes: on by default, one switch away from off. */
export function SocialPushToggle() {
  const { t } = useTranslation();
  const { session } = useSession();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const enabled = profile?.social_push ?? true;

  const onChange = async (value: boolean) => {
    update.mutate({ social_push: value });
    // Turning it on is the moment to ask for notifications: the person just chose them.
    if (value && session && (await ensureNotificationPermission())) await registerPushToken(session.user.id);
  };

  return <SettingSwitch title={t('push.social')} hint={t('push.socialHint')} value={enabled} onValueChange={onChange} />;
}
