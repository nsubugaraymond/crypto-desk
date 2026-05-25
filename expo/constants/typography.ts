import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  default: 'System',
});

const monoFamily = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  web: '"SF Mono", "Fira Code", "Fira Mono", "Roboto Mono", monospace',
  default: 'monospace',
});

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const FontSize = {
  xs: 11,
  sm: 12,
  caption: 13,
  body: 14,
  bodyLarge: 15,
  button: 16,
  subtitle: 16,
  title: 20,
  heading: 24,
  balance: 28,
  keypad: 28,
  display: 32,
};

export const LineHeight = {
  xs: 14,
  sm: 16,
  caption: 17,
  body: 20,
  bodyLarge: 22,
  button: 22,
  subtitle: 22,
  title: 26,
  heading: 30,
  balance: 34,
  keypad: 34,
  display: 40,
};

const createStyle = (
  size: number,
  weight: TextStyle['fontWeight'],
  lineHeight: number,
  extra?: Partial<TextStyle>,
): TextStyle => ({
  fontSize: size,
  fontWeight: weight,
  lineHeight,
  fontFamily: fontFamily as string,
  ...extra,
});

const Typography = {
  displayBold: createStyle(FontSize.display, FontWeight.bold, LineHeight.display),

  headingBold: createStyle(FontSize.heading, FontWeight.bold, LineHeight.heading),

  titleBold: createStyle(FontSize.title, FontWeight.bold, LineHeight.title),
  titleSemibold: createStyle(FontSize.title, FontWeight.semibold, LineHeight.title),

  subtitleSemibold: createStyle(FontSize.subtitle, FontWeight.semibold, LineHeight.subtitle),
  subtitleMedium: createStyle(FontSize.subtitle, FontWeight.medium, LineHeight.subtitle),

  bodyLargeMedium: createStyle(FontSize.bodyLarge, FontWeight.medium, LineHeight.bodyLarge),
  bodyLargeRegular: createStyle(FontSize.bodyLarge, FontWeight.regular, LineHeight.bodyLarge),

  bodyRegular: createStyle(FontSize.body, FontWeight.regular, LineHeight.body),
  bodyMedium: createStyle(FontSize.body, FontWeight.medium, LineHeight.body),
  bodySemibold: createStyle(FontSize.body, FontWeight.semibold, LineHeight.body),

  captionRegular: createStyle(FontSize.caption, FontWeight.regular, LineHeight.caption),
  captionSemibold: createStyle(FontSize.caption, FontWeight.semibold, LineHeight.caption),

  smallRegular: createStyle(FontSize.sm, FontWeight.regular, LineHeight.sm),
  smallMedium: createStyle(FontSize.sm, FontWeight.medium, LineHeight.sm),
  smallSemibold: createStyle(FontSize.sm, FontWeight.semibold, LineHeight.sm),

  xsRegular: createStyle(FontSize.xs, FontWeight.regular, LineHeight.xs),

  buttonText: createStyle(FontSize.button, FontWeight.semibold, LineHeight.button),

  balanceLarge: createStyle(FontSize.balance, FontWeight.bold, LineHeight.balance, {
    letterSpacing: -0.5,
  }),

  balanceMedium: createStyle(FontSize.title, FontWeight.bold, LineHeight.title, {
    letterSpacing: -0.3,
  }),

  keypadDigit: createStyle(FontSize.keypad, FontWeight.semibold, LineHeight.keypad),

  mono: createStyle(FontSize.body, FontWeight.regular, LineHeight.body, {
    fontFamily: monoFamily as string,
  }),

  monoSmall: createStyle(FontSize.sm, FontWeight.regular, LineHeight.sm, {
    fontFamily: monoFamily as string,
  }),

  labelUppercase: createStyle(FontSize.caption, FontWeight.semibold, LineHeight.caption, {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  }),
} as const;

export default Typography;
