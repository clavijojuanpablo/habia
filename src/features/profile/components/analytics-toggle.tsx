import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SettingSwitch } from '@/components/setting-switch';
import { isAnalyticsEnabled, setAnalyticsEnabled } from '@/lib/analytics';

/** Usage analytics are on by default and one switch away from off: no dark patterns. */
export function AnalyticsToggle() {
  const { t } = useTranslation();
  const [enabled, setEnabled] = useState(isAnalyticsEnabled);

  const onChange = (value: boolean) => {
    setAnalyticsEnabled(value);
    setEnabled(value);
  };

  return (
    <SettingSwitch
      title={t('profile.analytics')}
      hint={t('profile.analyticsHint')}
      value={enabled}
      onValueChange={onChange}
    />
  );
}
