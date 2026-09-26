import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { Colors, Elevation, Shape, StateLayer } from '@/constants/theme';

type Variant = 'elevated' | 'filled' | 'outlined';

const VARIANT: Record<Variant, ViewStyle> = {
  elevated: { backgroundColor: Colors.surfaceContainerLow, ...Elevation.level1 },
  filled: { backgroundColor: Colors.surfaceContainerHighest },
  outlined: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
};

interface CardProps {
  children: React.ReactNode;
  variant?: Variant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Card({ children, variant = 'elevated', onPress, style, accessibilityLabel }: CardProps) {
  const base: StyleProp<ViewStyle> = [
    { borderRadius: Shape.large, overflow: 'hidden' },
    VARIANT[variant],
    style,
  ];

  if (!onPress) return <View style={base}>{children}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [base, pressed && { opacity: 1 - StateLayer.pressed }]}
    >
      {children}
    </Pressable>
  );
}
