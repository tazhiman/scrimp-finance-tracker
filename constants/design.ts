import { Platform, ViewStyle, TextStyle } from 'react-native';

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
} as const;

export const Radius = {
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 999,
} as const;

export const FontSize = {
  caption: 11,
  footnote: 12,
  subheadline: 14,
  body: 16,
  headline: 17,
  title3: 20,
  title2: 24,
  title1: 28,
  largeTitle: 34,
} as const;

export const FontWeight = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semibold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
  heavy: '800' as TextStyle['fontWeight'],
};

export const Typography: Record<string, TextStyle> = {
  caption: { fontSize: FontSize.caption, fontWeight: FontWeight.medium },
  footnote: { fontSize: FontSize.footnote, fontWeight: FontWeight.medium },
  subheadline: { fontSize: FontSize.subheadline, fontWeight: FontWeight.medium },
  body: { fontSize: FontSize.body, fontWeight: FontWeight.regular },
  headline: { fontSize: FontSize.headline, fontWeight: FontWeight.semibold },
  title3: { fontSize: FontSize.title3, fontWeight: FontWeight.semibold },
  title2: { fontSize: FontSize.title2, fontWeight: FontWeight.bold },
  title1: { fontSize: FontSize.title1, fontWeight: FontWeight.bold },
  largeTitle: { fontSize: FontSize.largeTitle, fontWeight: FontWeight.bold },
};

const shadowBase = Platform.select({
  ios: {},
  android: {},
  default: {},
});

export const Shadow: Record<string, ViewStyle> = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 2,
    },
    android: { elevation: 2 },
    default: {},
  }) as ViewStyle,

  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.16,
      shadowRadius: 4,
    },
    android: { elevation: 4 },
    default: {},
  }) as ViewStyle,

  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.20,
      shadowRadius: 8,
    },
    android: { elevation: 8 },
    default: {},
  }) as ViewStyle,
};
