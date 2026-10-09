import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors } from '@/constants/theme';

/**
 * The app's loading indicator: three dots rising and settling in sequence.
 *
 * A ring is what every framework ships by default and reads as "the system is
 * busy". Dots travelling left to right read as progress through something,
 * which is what a farmer is actually waiting on — a field being saved, a
 * photograph being looked at — and they stay legible at the 7px a button can
 * spare, where a ring collapses into a smudge.
 *
 * Driven by the core Animated API with the native driver, the same way
 * Skeleton is, so the dots keep moving while JavaScript is blocked — which is
 * exactly when someone is looking at one. Deliberately not Reanimated
 * worklets: nothing else in the app uses them, and a loading indicator is the
 * worst place to discover a missing Babel plugin.
 */
export interface LoaderProps {
  /**
   * Overall footprint in px, not the dot. A dot is a quarter of it, so 28
   * suits a button and 48 or 64 a full screen.
   */
  size?: number;
  /**
   * `brand` is the green for light surfaces. `onColor` is for sitting inside a
   * filled button, where the brand green would be drawn on top of itself.
   */
  tone?: 'brand' | 'onColor';
  style?: ViewStyle;
}

const DOTS = 3;
/** One dot's full rise and fall. */
const CYCLE_MS = 540;
/** How far behind the previous dot each one starts. */
const STAGGER_MS = 150;

export function Loader({ size = 48, tone = 'brand', style }: LoaderProps) {
  const dots = useRef(
    Array.from({ length: DOTS }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          // Hold back, so the three are never in step.
          Animated.delay(i * STAGGER_MS),
          Animated.timing(dot, {
            toValue: 1,
            duration: CYCLE_MS / 2,
            easing: Easing.out(Easing.quad),
            // The web build has no native animated module, and asking for one
            // logs a warning on every mount before falling back to JS anyway.
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: CYCLE_MS / 2,
            easing: Easing.in(Easing.quad),
            useNativeDriver: Platform.OS !== 'web',
          }),
          // Wait out the dots behind, so every cycle starts together.
          Animated.delay((DOTS - 1 - i) * STAGGER_MS),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  const dotSize = Math.max(5, Math.round(size / 4));
  const gap = Math.round(dotSize * 0.75);
  const lift = Math.round(dotSize * 0.65);
  const colour = tone === 'onColor' ? '#ffffff' : Colors.primary;

  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <View style={[styles.row, { gap, height: dotSize + lift }]}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: colour,
              opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] }),
              transform: [
                { translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -lift] }) },
              ],
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
});
