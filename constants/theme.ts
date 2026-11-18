import { Platform } from 'react-native';

/**
 * Material Design 3 tokens, generated from the Agronavis seed colour #006C49.
 * Neutrals carry the same green tint as the primary, which is what makes an
 * MD3 surface read as one family rather than a green accent on grey.
 */

export const LightScheme = {
  primary: '#006c49',
  primaryContainer: '#8cf3c0',
  onPrimary: '#ffffff',
  onPrimaryContainer: '#00422b',
  primaryFixed: '#6ffbbe',
  primaryFixedDim: '#4edea3',
  inversePrimary: '#4edea3',

  secondary: '#1b6b51',
  secondaryContainer: '#cfe9da',
  onSecondary: '#ffffff',
  onSecondaryContainer: '#237157',
  secondaryFixed: '#a6f2d1',
  secondaryFixedDim: '#8bd9b8',
  onSecondaryFixed: '#092017',
  onSecondaryFixedVariant: '#237157',

  tertiary: '#855300',
  /**
   * A container is a tint, not the colour itself.
   *
   * This was #e29100 — a saturated orange — which made every surface using it
   * shout: the Medium soil band, the fire watch card, the Soon badge on
   * alerts. Worse, onTertiaryContainer is #523200, a dark brown meant to sit
   * on a pale ground, and on that orange it was barely readable. Tone 90 is
   * what the role calls for, and the palette already had it as
   * tertiaryFixed.
   */
  tertiaryContainer: '#ffdf9e',
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

  surface: '#f4fbf5',
  surfaceBright: '#f4fbf5',
  surfaceDim: '#d5dcd7',
  surfaceVariant: '#dbe5de',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#eff7f1',
  surfaceContainer: '#e8f0ea',
  surfaceContainerHigh: '#e2eae4',
  surfaceContainerHighest: '#dce5df',
  inverseSurface: '#2b322e',
  inverseOnSurface: '#eceff0',

  onSurface: '#161d19',
  onSurfaceVariant: '#3f4943',
  onBackground: '#161d19',
  background: '#f4fbf5',

  outline: '#6f7975',
  outlineVariant: '#bfc9c1',
  surfaceTint: '#006c49',

  /**
   * Brand roles, outside the generated palette.
   *
   * `forest` is the ground the weather and irrigation card sits on, `leaf`
   * the lime that marks a reading as good, `skyContainer` the tint weather
   * and rainfall take when they are not on forest.
   */
  forest: '#08321f',
  onForest: '#ffffff',
  leaf: '#7ecb4d',
  onLeaf: '#0b2a05',
  skyContainer: '#d3e8ff',
  onSkyContainer: '#0b1c30',

  onPrimaryFixed: '#002114',
  onPrimaryFixedVariant: '#00422b',
  scrim: '#000000',
  shadow: '#000000',
} as const;

export const DarkScheme: Record<keyof typeof LightScheme, string> = {
  forest: '#0b3d26',
  onForest: '#ffffff',
  leaf: '#9fdc74',
  onLeaf: '#0b2a05',
  skyContainer: '#1d3049',
  onSkyContainer: '#d7e3f8',

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

/**
 * Roboto, in the weights the design asks for.
 *
 * The design names Roboto Flex at 400 / 640 / 680 / 700 / 760. Flex is a
 * variable font and React Native cannot set a weight axis on one, so each
 * weight here is a real cut of Roboto — the same typeface, shipped as static
 * instances — rounded to the nearest one that exists.
 *
 * A family name is the whole story on Android: `fontWeight` on a loaded
 * custom font is ignored there, and asking for bold on a regular cut gets a
 * smeared synthetic bold. So the weight lives in the family, never in
 * `fontWeight`.
 */
export const FontFace = {
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  semiBold: 'Roboto_600SemiBold',
  bold: 'Roboto_700Bold',
  extraBold: 'Roboto_800ExtraBold',
} as const;

const systemFont = FontFace.regular;

/** MD3 type scale, mapped onto the platform system font. */
export const Type = {
  displayLarge: { fontFamily: FontFace.bold, fontSize: 57, lineHeight: 64, letterSpacing: -0.25 },
  displayMedium: { fontFamily: FontFace.bold, fontSize: 45, lineHeight: 52, letterSpacing: 0 },
  displaySmall: { fontFamily: FontFace.bold, fontSize: 36, lineHeight: 44, letterSpacing: 0 },

  headlineLarge: { fontFamily: FontFace.extraBold, fontSize: 32, lineHeight: 40, letterSpacing: 0 },
  headlineMedium: { fontFamily: FontFace.extraBold, fontSize: 28, lineHeight: 36, letterSpacing: 0 },
  headlineSmall: { fontFamily: FontFace.extraBold, fontSize: 24, lineHeight: 32, letterSpacing: 0 },

  titleLarge: { fontFamily: FontFace.bold, fontSize: 22, lineHeight: 28, letterSpacing: 0 },
  titleMedium: { fontFamily: FontFace.semiBold, fontSize: 16, lineHeight: 24, letterSpacing: 0.15 },
  titleSmall: { fontFamily: FontFace.semiBold, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },

  bodyLarge: { fontFamily: FontFace.regular, fontSize: 16, lineHeight: 24, letterSpacing: 0.5 },
  bodyMedium: { fontFamily: FontFace.regular, fontSize: 14, lineHeight: 20, letterSpacing: 0.25 },
  bodySmall: { fontFamily: FontFace.regular, fontSize: 12, lineHeight: 16, letterSpacing: 0.4 },

  labelLarge: { fontFamily: FontFace.bold, fontSize: 14, lineHeight: 20, letterSpacing: 0.1 },
  labelMedium: { fontFamily: FontFace.bold, fontSize: 12, lineHeight: 16, letterSpacing: 0.5 },
  labelSmall: { fontFamily: FontFace.bold, fontSize: 11, lineHeight: 16, letterSpacing: 0.5 },
} as const;

/**
 * M3 Expressive's emphasized type scale. Same metrics as the standard scale,
 * heavier weight and tighter tracking — this is the knob Expressive turns to
 * create hierarchy, instead of reaching for a bigger font size.
 */
export const TypeEmphasized = {
  displayLarge: { ...Type.displayLarge, fontFamily: FontFace.extraBold, letterSpacing: -1 },
  displayMedium: { ...Type.displayMedium, fontFamily: FontFace.extraBold, letterSpacing: -0.8 },
  displaySmall: { ...Type.displaySmall, fontFamily: FontFace.extraBold, letterSpacing: -0.6 },

  headlineLarge: { ...Type.headlineLarge, fontFamily: FontFace.extraBold, letterSpacing: -0.6 },
  headlineMedium: { ...Type.headlineMedium, fontFamily: FontFace.extraBold, letterSpacing: -0.5 },
  headlineSmall: { ...Type.headlineSmall, fontFamily: FontFace.extraBold, letterSpacing: -0.4 },

  titleLarge: { ...Type.titleLarge, fontFamily: FontFace.extraBold, letterSpacing: -0.3 },
  titleMedium: { ...Type.titleMedium, fontFamily: FontFace.extraBold },
  titleSmall: { ...Type.titleSmall, fontFamily: FontFace.extraBold },

  bodyLarge: { ...Type.bodyLarge, fontFamily: FontFace.bold },
  bodyMedium: { ...Type.bodyMedium, fontFamily: FontFace.bold },

  labelLarge: { ...Type.labelLarge, fontFamily: FontFace.extraBold, letterSpacing: 0 },
  labelMedium: { ...Type.labelMedium, fontFamily: FontFace.extraBold },
  labelSmall: { ...Type.labelSmall, fontFamily: FontFace.extraBold },
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
