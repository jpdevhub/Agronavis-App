import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shape, Spacing, Type } from '@/constants/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

interface ChipProps {
  label: string;
  icon?: IconName;
  selected?: boolean;
  onPress?: () => void;
  container?: string;
  onContainer?: string;
}

export function Chip({ label, icon, selected = false, onPress, container, onContainer }: ChipProps) {
  const background = container ?? (selected ? Colors.secondaryContainer : 'transparent');
  const foreground = onContainer ?? (selected ? Colors.onSecondaryContainer : Colors.onSurfaceVariant);
  const Wrapper = onPress ? Pressable : View;

  return (
    <Wrapper
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={[
        styles.chip,
        { backgroundColor: background },
        !container && !selected && styles.outlined,
      ]}
    >
      {icon ? <MaterialIcons name={icon} size={16} color={foreground} /> : null}
      <Text style={[styles.label, { color: foreground }]} numberOfLines={1}>
        {label}
      </Text>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingHorizontal: Spacing.md,
    borderRadius: Shape.small,
  },
  outlined: { borderWidth: 1, borderColor: Colors.outlineVariant },
  label: { ...Type.labelLarge },
});
