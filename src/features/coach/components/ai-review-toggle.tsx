import { useTranslation } from 'react-i18next';

import { SettingSwitch } from '@/components/setting-switch';
import { useProfile, useUpdateProfile } from '@/features/profile/api';
import { track } from '@/lib/analytics';

/** Opt-in switch for the AI weekly review (Profile shows it only while the server can write reviews). */
export function AiReviewToggle() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  if (!profile) return null;

  return (
    <SettingSwitch
      title={t('weeklyReview.toggle')}
      hint={t('weeklyReview.toggleHint')}
      value={profile.ai_coach_enabled}
      onValueChange={(value) => {
        track(value ? 'ai_review_enabled' : 'ai_review_disabled');
        update.mutate({ ai_coach_enabled: value });
      }}
    />
  );
}
