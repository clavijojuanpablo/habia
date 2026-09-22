import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Fonts, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?:
    | 'default'
    | 'hero'
    | 'title'
    | 'subtitle'
    | 'heading'
    | 'small'
    | 'smallBold'
    | 'caption'
    | 'link'
    | 'linkPrimary'
    | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        styles[type],
        type === 'linkPrimary' && { color: theme.primary },
        style,
      ]}
      {...rest}
    />
  );
}

// Weight comes from the font family (never fontWeight) so custom fonts render on Android.
const styles = StyleSheet.create({
  default: { fontFamily: FontFamily.regular, fontSize: 16, lineHeight: 22 },
  hero: { fontFamily: FontFamily.black, fontSize: 64, lineHeight: 70 },
  title: { fontFamily: FontFamily.black, fontSize: 36, lineHeight: 42 },
  subtitle: { fontFamily: FontFamily.black, fontSize: 26, lineHeight: 32 },
  heading: { fontFamily: FontFamily.bold, fontSize: 18, lineHeight: 24 },
  small: { fontFamily: FontFamily.regular, fontSize: 14, lineHeight: 20 },
  smallBold: { fontFamily: FontFamily.bold, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: FontFamily.medium, fontSize: 12, lineHeight: 16 },
  link: { fontFamily: FontFamily.medium, fontSize: 14, lineHeight: 30 },
  linkPrimary: { fontFamily: FontFamily.bold, fontSize: 14, lineHeight: 30 },
  code: { fontFamily: Fonts.mono, fontSize: 12 },
});
