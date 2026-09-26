import { Platform } from 'react-native';

/**
 * Material Design 3 tokens, generated from the Agronavis seed colour #006C49.
 * Neutrals carry the same green tint as the primary, which is what makes an
 * MD3 surface read as one family rather than a green accent on grey.
 */

export const LightScheme = {
  primary: '#006c49',
  primaryContainer: '#10b981',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#00422b',
  primaryFixed: '#6ffbbe',
  primaryFixedDim: '#4edea3',
  inversePrimary: '#4edea3',

  secondary: '#1b6b51',
  secondaryContainer: '#a6f2d1',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#237157',
  secondaryFixed: '#a6f2d1',
  secondaryFixedDim: '#8bd9b8',
  onSecondaryFixed: '#092017',
  onSecondaryFixedVariant: '#237157',

  tertiary: '#855300',
  tertiaryContainer: '#e29100',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#523200',
  tertiaryFixed: '#ffddb8',
  tertiaryFixedDim: '#ffb95f',
  onTertiaryFixed: '#2b1700',
  onTertiaryFixedVariant: '#653f00',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  surface: '#f8f9ff',
  surfaceBright: '#f8f9ff',
  surfaceDim: '#cbdbf5',
  surfaceVariant: '#d3e4fe',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff4ff',
  surfaceContainer: '#e5eeff',
  surfaceContainerHigh: '#dce9ff',
  surfaceContainerHighest: '#d3e4fe',
  inverseSurface: '#213145',
  inverseOnSurface: '#eaf1ff',

  onSurface: '#0b1c30',
  onSurfaceVariant: '#3c4a42',
  onBackground: '#0b1c30',
  background: '#f8f9ff',

  outline: '#6c7a71',
  outlineVariant: '#bbcabf',
  surfaceTint: '#006c49',

  onPrimaryFixed: '#002114',
  onPrimaryFixedVariant: '#00422b',
  scrim: '#000000',
  shadow: '#000000',
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
/**
 * M3 Expressive shape scale. Expressive widens the top of the scale and adds
 * the "increased" steps, so a surface can be emphatically round without
 * jumping straight to a pill.
 */
export const Shape = {
  none: 0,
  extraSmall: 4,
  small: 8,
  medium: 12,
  large: 16,
  largeIncreased: 20,
  extraLarge: 28,
  extraLargeIncreased: 32,
  extraExtraLarge: 48,
  full: 9999,
} as const;

export const Radii = {
  sm: Shape.small,
  md: Shape.medium,
  lg: Shape.large,
  xl: Shape.largeIncreased,
  xxl: Shape.extraLarge,
  xxxl: Shape.extraLargeIncreased,
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

/**
 * M3 Expressive's emphasized type scale. Same metrics as the standard scale,
 * heavier weight and tighter tracking — this is the knob Expressive turns to
 * create hierarchy, instead of reaching for a bigger font size.
 */
export const TypeEmphasized = {
  displayLarge: { ...Type.displayLarge, fontWeight: '800' as const, letterSpacing: -1 },
  displayMedium: { ...Type.displayMedium, fontWeight: '800' as const, letterSpacing: -0.8 },
  displaySmall: { ...Type.displaySmall, fontWeight: '800' as const, letterSpacing: -0.6 },

  headlineLarge: { ...Type.headlineLarge, fontWeight: '800' as const, letterSpacing: -0.6 },
  headlineMedium: { ...Type.headlineMedium, fontWeight: '800' as const, letterSpacing: -0.5 },
  headlineSmall: { ...Type.headlineSmall, fontWeight: '800' as const, letterSpacing: -0.4 },

  titleLarge: { ...Type.titleLarge, fontWeight: '800' as const, letterSpacing: -0.3 },
  titleMedium: { ...Type.titleMedium, fontWeight: '700' as const },
  titleSmall: { ...Type.titleSmall, fontWeight: '700' as const },

  bodyLarge: { ...Type.bodyLarge, fontWeight: '600' as const },
  bodyMedium: { ...Type.bodyMedium, fontWeight: '600' as const },

  labelLarge: { ...Type.labelLarge, fontWeight: '800' as const, letterSpacing: 0 },
  labelMedium: { ...Type.labelMedium, fontWeight: '700' as const },
  labelSmall: { ...Type.labelSmall, fontWeight: '700' as const },
} as const;

/**
 * Expressive motion is spring-based, not curve-based. These feed
 * `Animated.spring`; the spatial set moves things, the effects set changes
 * colour and opacity.
 */
export const Motion = {
  spatialFast: { damping: 26, stiffness: 900, mass: 1 },
  spatialDefault: { damping: 24, stiffness: 500, mass: 1 },
  spatialSlow: { damping: 26, stiffness: 260, mass: 1 },
  effectsFast: { damping: 30, stiffness: 1200, mass: 1 },
  effectsDefault: { damping: 30, stiffness: 700, mass: 1 },
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
