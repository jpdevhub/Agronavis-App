import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shape, Spacing, StateLayer, Type } from '@/constants/theme';

type Variant = 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated';
type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const CONTAINER = {
  filled: { backgroundColor: Colors.primary },
  tonal: { backgroundColor: Colors.secondaryContainer },
  elevated: { backgroundColor: Colors.surfaceContainerLow },
  outlined: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.outline },
  text: { backgroundColor: 'transparent' },
} as const;

const LABEL = {
  filled: Colors.onPrimary,
  tonal: Colors.onSecondaryContainer,
  elevated: Colors.primary,
  outlined: Colors.primary,
  text: Colors.primary,
} as const;

export function Button({
  label,
  onPress,
  variant = 'filled',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const inactive = disabled || loading;
  const color = LABEL[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        CONTAINER[variant],
        variant === 'text' && styles.textVariant,
        fullWidth && styles.fullWidth,
        inactive && styles.disabled,
        pressed && !inactive && { opacity: 1 - StateLayer.pressed },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <View style={styles.content}>
          {icon ? <MaterialIcons name={icon} size={18} color={color} /> : null}
          <Text style={[styles.label, { color }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 40,
    paddingHorizontal: Spacing.xl,
    borderRadius: Shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textVariant: { paddingHorizontal: Spacing.md },
  fullWidth: { alignSelf: 'stretch' },
  disabled: { opacity: StateLayer.disabled },
  content: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  label: { ...Type.labelLarge },
});
