import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { EligibleCrop } from '@agronavis/shared-types';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';

/**
 * A crop the scheme lists for this state that we cannot yet rank.
 *
 * Shown, because the scheme says it grows here and that is the farmer's to
 * weigh. Marked, because an unranked crop beside ranked ones would otherwise
 * read as one that scored badly.
 */
export const UnratedRow = memo(function UnratedRow({
  crop,
  selected,
  onPress,
}: {
  crop: EligibleCrop;
  selected?: boolean;
  onPress: (crop: EligibleCrop) => void;
}) {
  return (
    <Pressable
      style={[styles.row, selected && styles.rowSelected]}
      onPress={() => onPress(crop)}
      accessibilityRole="button"
      accessibilityState={{ selected: Boolean(selected) }}
      accessibilityLabel={`${crop.label}, not yet rated`}
    >
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{crop.name.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{crop.label}</Text>
        <Text style={styles.sub}>Grown here · not yet rated</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Shape.large, padding: Spacing.lg, minHeight: 68,
    borderWidth: 1, borderColor: 'transparent',
  },
  rowSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryFixed },
  badge: {
    width: 40, height: 40, borderRadius: Shape.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { ...TypeEmphasized.titleMedium, color: Colors.onSurfaceVariant },
  body: { flex: 1 },
  name: { ...TypeEmphasized.titleSmall, color: Colors.onSurface },
  sub: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: 2 },
});
