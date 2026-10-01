import { StyleSheet, View } from 'react-native';

import { Brote } from '@/features/mascot/brote';
import { useTheme } from '@/hooks/use-theme';

/**
 * A person's face in social lists. Until the customizable character exists (docs/CHARACTER-ART.md)
 * it is Brote on a ring of the color the person picked.
 */
export function SocialAvatar({ color, size = 48 }: { color: string; size?: number }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.ring,
        { width: size, height: size, borderRadius: size / 2, borderColor: color, backgroundColor: theme.background },
      ]}>
      <Brote size={size * 0.9} animated={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  ring: { borderWidth: 3, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
