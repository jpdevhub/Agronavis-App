import { Platform } from 'react-native';

/**
 * Material Design 3 tokens, generated from the Agronavis seed colour #006C49.
 * Neutrals carry the same green tint as the primary, which is what makes an
 * MD3 surface read as one family rather than a green accent on grey.
 */

export const LightScheme = {
  primary: '#006c49',
  onPrimary: '#ffffff',
  primaryContainer: '#87f8c4',
  onPrimaryContainer: '#002114',

  secondary: '#4c6358',
  onSecondary: '#ffffff',
  secondaryContainer: '#cee9da',
  onSecondaryContainer: '#092017',

  tertiary: '#3e6374',
  onTertiary: '#ffffff',
  tertiaryContainer: '#c1e8fc',
  onTertiaryContainer: '#001f2a',

  error: '#ba1a1a',
  onError: '#ffffff',
  errorContainer: '#ffdad6',
  onErrorContainer: '#410002',

  background: '#f5fbf6',
  onBackground: '#171d1a',
  surface: '#f5fbf6',
  onSurface: '#171d1a',
  surfaceVariant: '#dbe5dd',
  onSurfaceVariant: '#404943',

  surfaceDim: '#d6dbd6',
  surfaceBright: '#f5fbf6',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff5ef',
  surfaceContainer: '#eaefe9',
  surfaceContainerHigh: '#e4eae4',
  surfaceContainerHighest: '#dee4de',

  outline: '#707973',
  outlineVariant: '#bfc9c2',
  inverseSurface: '#2b322e',
  inverseOnSurface: '#ecf2ec',
  inversePrimary: '#6adba8',
  surfaceTint: '#006c49',
  scrim: '#000000',
  shadow: '#000000',

  primaryFixed: '#87f8c4',
  onPrimaryFixed: '#002114',
  primaryFixedDim: '#6adba8',
  onPrimaryFixedVariant: '#005236',
  secondaryFixed: '#cee9da',
  onSecondaryFixed: '#092017',
  secondaryFixedDim: '#b2ccbf',
  onSecondaryFixedVariant: '#354b41',
  tertiaryFixed: '#c1e8fc',
  onTertiaryFixed: '#001f2a',
  tertiaryFixedDim: '#a6cce0',
  onTertiaryFixedVariant: '#254b5c',
} as const;

export const DarkScheme: Record<keyof typeof LightScheme, string> = {
  primary: '#6adba8',
  onPrimary: '#003825',
  primaryContainer: '#005236',
  onPrimaryContainer: '#87f8c4',

  secondary: '#b2ccbf',
  onSecondary: '#1e352b',
  secondaryContainer: '#354b41',
  onSecondaryContainer: '#cee9da',

  tertiary: '#a6cce0',
  onTertiary: '#0a3445',
  tertiaryContainer: '#254b5c',
  onTertiaryContainer: '#c1e8fc',

  error: '#ffb4ab',
  onError: '#690005',
  errorContainer: '#93000a',
  onErrorContainer: '#ffdad6',

  background: '#0f1512',
  onBackground: '#dee4de',
  surface: '#0f1512',
  onSurface: '#dee4de',
  surfaceVariant: '#404943',
  onSurfaceVariant: '#bfc9c2',

  surfaceDim: '#0f1512',
  surfaceBright: '#353b37',
  surfaceContainerLowest: '#0a0f0d',
  surfaceContainerLow: '#171d1a',
  surfaceContainer: '#1b211e',
  surfaceContainerHigh: '#262b28',
  surfaceContainerHighest: '#303733',

  outline: '#8a938c',
  outlineVariant: '#404943',
  inverseSurface: '#dee4de',
  inverseOnSurface: '#2b322e',
  inversePrimary: '#006c49',
  surfaceTint: '#6adba8',
  scrim: '#000000',
  shadow: '#000000',

  primaryFixed: '#87f8c4',
  onPrimaryFixed: '#002114',
  primaryFixedDim: '#6adba8',
  onPrimaryFixedVariant: '#005236',
  secondaryFixed: '#cee9da',
  onSecondaryFixed: '#092017',
  secondaryFixedDim: '#b2ccbf',
  onSecondaryFixedVariant: '#354b41',
  tertiaryFixed: '#c1e8fc',
  onTertiaryFixed: '#001f2a',
  tertiaryFixedDim: '#a6cce0',
  onTertiaryFixedVariant: '#254b5c',
};

export const Colors = LightScheme;
export type ColorScheme = typeof LightScheme;

/** MD3 shape scale. */
export const Shape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  extraLarge: 28,
  full: 9999,
} as const;

export const Radii = {
  sm: Shape.small,
  md: Shape.medium,
  lg: Shape.large,
  xl: 24,
  xxl: Shape.extraLarge,
  full: Shape.full,
} as const;

/** 4dp base grid. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

const shadow = (elevation: number, opacity: number, radius: number) =>
  Platform.select({
    android: { elevation },
    default: {
      shadowColor: LightScheme.shadow,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: Math.ceil(elevation / 2) },
    },
  })!;

/** MD3 elevation levels 0-5. */
export const Elevation = {
  level0: Platform.select({ android: { elevation: 0 }, default: {} })!,
  level1: shadow(1, 0.1, 3),
  level2: shadow(3, 0.12, 6),
  level3: shadow(6, 0.14, 10),
  level4: shadow(8, 0.16, 12),
  level5: shadow(12, 0.18, 16),
} as const;

const systemFont = Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' });

/** MD3 type scale, mapped onto the platform system font. */
export const Type = {
  displayLarge: { fontFamily: systemFont, fontSize: 57, lineHeight: 64, letterSpacing: -0.25, fontWeight: '400' as const },
  displayMedium: { fontFamily: systemFont, fontSize: 45, lineHeight: 52, letterSpacing: 0, fontWeight: '400' as const },
  displaySmall: { fontFamily: systemFont, fontSize: 36, lineHeight: 44, letterSpacing: 0, fontWeight: '400' as const },

  headlineLarge: { fontFamily: systemFont, fontSize: 32, lineHeight: 40, letterSpacing: 0, fontWeight: '400' as const },
  headlineMedium: { fontFamily: systemFont, fontSize: 28, lineHeight: 36, letterSpacing: 0, fontWeight: '400' as const },
  headlineSmall: { fontFamily: systemFont, fontSize: 24, lineHeight: 32, letterSpacing: 0, fontWeight: '400' as const },

  titleLarge: { fontFamily: systemFont, fontSize: 22, lineHeight: 28, letterSpacing: 0, fontWeight: '500' as const },
  titleMedium: { fontFamily: systemFont, fontSize: 16, lineHeight: 24, letterSpacing: 0.15, fontWeight: '600' as const },
  titleSmall: { fontFamily: systemFont, fontSize: 14, lineHeight: 20, letterSpacing: 0.1, fontWeight: '600' as const },

  bodyLarge: { fontFamily: systemFont, fontSize: 16, lineHeight: 24, letterSpacing: 0.5, fontWeight: '400' as const },
  bodyMedium: { fontFamily: systemFont, fontSize: 14, lineHeight: 20, letterSpacing: 0.25, fontWeight: '400' as const },
  bodySmall: { fontFamily: systemFont, fontSize: 12, lineHeight: 16, letterSpacing: 0.4, fontWeight: '400' as const },

  labelLarge: { fontFamily: systemFont, fontSize: 14, lineHeight: 20, letterSpacing: 0.1, fontWeight: '600' as const },
  labelMedium: { fontFamily: systemFont, fontSize: 12, lineHeight: 16, letterSpacing: 0.5, fontWeight: '600' as const },
  labelSmall: { fontFamily: systemFont, fontSize: 11, lineHeight: 16, letterSpacing: 0.5, fontWeight: '600' as const },
} as const;

/** State layer opacities from the MD3 interaction spec. */
export const StateLayer = { hover: 0.08, focus: 0.12, pressed: 0.12, dragged: 0.16, disabled: 0.38 } as const;

/** Severity colours shared by advisories, alerts and NPK chips. */
export const Severity = {
  critical: { container: LightScheme.errorContainer, on: LightScheme.onErrorContainer, accent: LightScheme.error },
  high: { container: '#ffddb8', on: '#2b1700', accent: '#a15c00' },
  medium: { container: LightScheme.tertiaryContainer, on: LightScheme.onTertiaryContainer, accent: LightScheme.tertiary },
  low: { container: LightScheme.secondaryContainer, on: LightScheme.onSecondaryContainer, accent: LightScheme.secondary },
} as const;

export const FontFamily = {
  black: systemFont,
  bold: systemFont,
  semiBold: systemFont,
  regular: systemFont,
} as const;
