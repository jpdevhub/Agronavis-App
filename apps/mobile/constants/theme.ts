// ─── Agronavis Design Tokens ──────────────────────────────────────────────────
// Material You palette — single source of truth for the entire app.

export const Colors = {
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

  tertiary: '#855300',
  tertiaryContainer: '#e29100',
  onTertiary: '#ffffff',
  onTertiaryContainer: '#523200',
  tertiaryFixed: '#ffddb8',
  tertiaryFixedDim: '#ffb95f',

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
} as const;

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  full: 9999,
} as const;

export const FontFamily = {
  black: 'PublicSans_900Black',
  bold: 'PublicSans_700Bold',
  semiBold: 'PublicSans_600SemiBold',
  regular: 'PublicSans_400Regular',
} as const;
