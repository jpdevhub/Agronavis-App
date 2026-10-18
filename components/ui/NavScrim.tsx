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

  // Gesture navigation reports almost nothing here and needs no cover.
  if (insets.bottom < 12) return null;

  return (
    <View style={[styles.wrap, { height: insets.bottom }]} pointerEvents="none">
      <BlurView
        intensity={Platform.OS === 'android' ? 24 : 32}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={[StyleSheet.absoluteFill, styles.tint]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 30 },
  // Never fully opaque: content should read as behind it, not cut off.
  tint: { backgroundColor: 'rgba(248, 249, 255, 0.72)' },
});
