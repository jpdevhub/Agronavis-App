import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Shape, Spacing, TypeEmphasized } from '@/constants/theme';
import { Env } from '@/constants/env';
import { FLOATING_BAR_HEIGHT } from '@/components/navigation/FloatingTabBar';

/** Height of the Sahayak pill plus its gap, for screens with their own FAB. */
export const SAHAYAK_FAB_SPACE = 56 + Spacing.md;

/** Floating entry point to Sahayak, above the tab bar on every tab. */
export function SahayakGateway() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  if (!Env.features.sahayak) return null;

  /**
   * Clear of the tab bar rather than resting on it.
   *
   * FLOATING_BAR_HEIGHT excludes the safe-area inset and the gap the bar
   * itself sits above, so adding only one gap left the pill overlapping the
   * bar's top edge — visible as Sahayak sitting across the nav row.
   */
  const bottom = FLOATING_BAR_HEIGHT + insets.bottom + Spacing.xl;

  return (
    <>
      <View style={[styles.wrap, { bottom, pointerEvents: 'box-none' }]}>
        <Pressable
          onPress={() => router.push('/sahayak' as never)}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Ask Sahayak"
        >
          <MaterialIcons name="forum" size={22} color={Colors.onPrimaryContainer} />
          <Text style={styles.label}>Sahayak</Text>
        </Pressable>
      </View>

    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: Spacing.xl, alignItems: 'flex-end' },
  fab: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    height: 56, paddingHorizontal: Spacing.xl,
    borderRadius: Shape.full, backgroundColor: Colors.primaryFixed,
    ...Elevation.level3,
  },
  label: { ...TypeEmphasized.titleMedium, color: Colors.onPrimaryContainer },
});
