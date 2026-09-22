import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

/** Cross-platform icon names: SF Symbols on iOS, Material Symbols on Android and web. */
const ICONS = {
  today: { ios: 'sun.max.fill', android: 'wb_sunny', web: 'wb_sunny' },
  week: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  profile: { ios: 'person.crop.circle', android: 'account_circle', web: 'account_circle' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  back: { ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' },
  forward: { ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' },
} satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 22, color }: { name: IconName; size?: number; color: ColorValue }) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
