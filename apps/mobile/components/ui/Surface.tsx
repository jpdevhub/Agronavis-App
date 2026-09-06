import { View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Elevation, Shape } from '@/constants/theme';

type Level = 0 | 1 | 2 | 3 | 4 | 5;

const TONE: Record<Level, string> = {
  0: Colors.surface,
  1: Colors.surfaceContainerLow,
  2: Colors.surfaceContainer,
  3: Colors.surfaceContainerHigh,
  4: Colors.surfaceContainerHigh,
  5: Colors.surfaceContainerHighest,
};

const SHADOW = [
  Elevation.level0,
  Elevation.level1,
  Elevation.level2,
  Elevation.level3,
  Elevation.level4,
  Elevation.level5,
];

interface SurfaceProps {
  children?: React.ReactNode;
  level?: Level;
  radius?: number;
  shadow?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Surface({ children, level = 1, radius = Shape.large, shadow = false, style }: SurfaceProps) {
  return (
    <View
      style={[
        { backgroundColor: TONE[level], borderRadius: radius },
        shadow ? SHADOW[level] : null,
        style,
      ]}
    >
      {children}
    </View>
  );
}
