import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Radius, Shadow, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { hapticLight } from '@/lib/haptics';

/** Colorful emoji icons + a pastel tile behind the active tab, Duolingo-style. */
const TAB_STYLE: Record<string, { emoji: string; tint: ThemeColor }> = {
  index: { emoji: '☀️', tint: 'streakSoft' },
  week: { emoji: '📅', tint: 'lavenderSoft' },
  garden: { emoji: '🌳', tint: 'primarySoft' },
  progress: { emoji: '📊', tint: 'goldSoft' },
  profile: { emoji: '🙂', tint: 'backgroundSelected' },
};

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, Spacing.two) }]}>
      <View style={[styles.bar, { backgroundColor: theme.tabBar, boxShadow: Shadow.raised }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const label = typeof options.title === 'string' ? options.title : route.name;
          const style = TAB_STYLE[route.name] ?? { emoji: '•', tint: 'backgroundSelected' };

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              hapticLight();
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={label}
              style={({ pressed }) => [styles.tab, { transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
              <View style={[styles.iconTile, focused && { backgroundColor: theme[style.tint] }]}>
                <ThemedText style={[styles.emoji, !focused && styles.unfocused]}>{style.emoji}</ThemedText>
              </View>
              <ThemedText
                type="caption"
                numberOfLines={1}
                style={{ color: focused ? theme.text : theme.textSecondary }}>
                {label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: Spacing.three, paddingTop: Spacing.two },
  bar: {
    flexDirection: 'row',
    borderRadius: Radius.xl,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.one,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  tab: { flex: 1, alignItems: 'center', gap: 2 },
  iconTile: {
    width: 52,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 24, lineHeight: 30 },
  unfocused: { opacity: 0.55 },
});
