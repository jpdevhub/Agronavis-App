import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

/**
 * Frosts the strip behind Android's navigation buttons.
 *
 * SDK 54 draws edge to edge, so a scrolling screen runs underneath the system
 * navigation bar. On the tab screens the floating bar already blurs that
 * strip; on a detail screen there is nothing there, and a table of readings
 * scrolls under the three buttons and stays legible enough to look like a
 * bug — "0.8 m/s" half behind a home button.
 *
 * Matches the tab bar rather than inventing a second treatment: the same
 * Dimezis blur, the same surface tint, so a farmer moving between the two
 * sees one idea.
 */
export function NavScrim() {
  const insets = useSafeAreaInsets();

  // Gesture navigation leaves a thin hint bar that needs no cover; a
  // three-button bar is tall and does. The threshold was 12, which some
  // devices report for a real button bar, so the strip never appeared.
  if (insets.bottom < 8) return null;

  return (
    <View style={[styles.wrap, { height: insets.bottom }]} pointerEvents="none">
      <BlurView
        // Stronger than the tab bar's: that one sits under a solid pill which
        // already hides most of what passes behind it, while this is the only
        // thing between a table of readings and the home button.
        intensity={Platform.OS === 'android' ? 40 : 48}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={[StyleSheet.absoluteFill, styles.tint]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30 },
  // Never fully opaque: content should read as passing behind it rather than
  // being cut off. Opaque enough, though, that text under the buttons is no
  // longer readable — half-legible is what made it look like a fault.
  tint: { backgroundColor: 'rgba(248, 249, 255, 0.88)' },
});
