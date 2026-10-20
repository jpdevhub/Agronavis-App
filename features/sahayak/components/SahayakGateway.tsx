import { Pressable, StyleSheet, Text, View } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Shape, Spacing, TypeEmphasized } from '@/constants/theme';
import { Env } from '@/constants/env';
import { FLOATING_BAR_HEIGHT } from '@/components/navigation/FloatingTabBar';

/** How far the pill sits above the tab bar. */
const SAHAYAK_LIFT = Spacing.xl;

/** The pill's own height. */
const SAHAYAK_HEIGHT = 56;

/**
 * Everything the Sahayak pill occupies above the tab bar — its lift, its
 * height and a gap over it.
 *
 * Screens with a floating button of their own stack on top of this, and
 * scrolling lists pad by it. It omitted the lift, so raising the pill clear of
 * the tab bar pushed it straight into My Farms' "Map New Field" button.
 */
export const SAHAYAK_FAB_SPACE = SAHAYAK_LIFT + SAHAYAK_HEIGHT + Spacing.md;

/** Floating entry point to Sahayak, above the tab bar on every tab. */
/**
 * Screens the pill stays off.
 *
 * Both are single-purpose and full-bleed, with nothing to spare at the bottom.
 * The scanner is a viewfinder over a short strip of advice; the field drawer
 * is a map whose own sheet explains what to tap, and the pill landed across
 * that sentence. Someone holding a phone over a leaf, or tracing the corners
 * of their land, is not looking for a chat button — and on the drawer it was
 * covering the only instruction on the screen.
 */
const WITHOUT_SAHAYAK = ['/scan', '/farm/map'];

export function SahayakGateway() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  if (!Env.features.sahayak) return null;
  if (WITHOUT_SAHAYAK.some((p) => pathname.startsWith(p))) return null;

  /**
   * Clear of the tab bar rather than resting on it.
   *
   * FLOATING_BAR_HEIGHT excludes the safe-area inset and the gap the bar
   * itself sits above, so adding only one gap left the pill overlapping the
   * bar's top edge — visible as Sahayak sitting across the nav row.
   */
  const bottom = FLOATING_BAR_HEIGHT + insets.bottom + SAHAYAK_LIFT;

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
    height: SAHAYAK_HEIGHT, paddingHorizontal: Spacing.xl,
    borderRadius: Shape.full, backgroundColor: Colors.primaryFixed,
    ...Elevation.level3,
  },
  label: { ...TypeEmphasized.titleMedium, color: Colors.onPrimaryContainer },
});
