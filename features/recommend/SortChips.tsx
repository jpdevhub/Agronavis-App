import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { SORTS, type SortKey } from './formatting';

/** Which measure the list is ordered by. Changes the order, never the length. */
export function SortChips({
  active,
  onChange,
}: {
  active: SortKey;
  onChange: (key: SortKey) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {SORTS.map(({ key, label }) => {
        const on = key === active;
        return (
          <Pressable
            key={key}
            onPress={() => onChange(key)}
            style={[styles.chip, on && styles.chipOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: on }}
          >
            <Text style={[styles.text, on && styles.textOn]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.sm },
  chip: {
    borderRadius: Shape.full, borderWidth: 1, borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.lg, minHeight: 40, justifyContent: 'center',
  },
  chipOn: { backgroundColor: Colors.secondaryContainer, borderColor: 'transparent' },
  text: { ...Type.labelLarge, color: Colors.onSurfaceVariant },
  textOn: { ...TypeEmphasized.labelLarge, color: Colors.onSecondaryContainer },
});
