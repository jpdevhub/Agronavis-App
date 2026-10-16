import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '@/constants/theme';

/**
 * The app's loading indicator: a dot running the infinity loop.
 *
 * A ring is what every framework ships and reads as "the system is busy". A
 * figure of eight reads as something continuing — which is what waiting on a
 * field to save or a photograph to be read actually is — and it carries the
 * brand far better than a tinted system spinner.
 *
 * The path is a lemniscate of Bernoulli, x = cos t / (1 + sin²t) and
 * y = sin t·cos t / (1 + sin²t). The dot is moved by animating the stroke of a
 * second, nearly invisible copy of the path, so the curve itself does the
 * positioning and nothing has to recompute coordinates per frame.
 *
 * Driven by the core Animated API the same way Skeleton is. Deliberately not
 * Reanimated worklets: nothing else in the app uses them, and a loading
 * indicator is the worst place to find out the build is missing a plugin.
 */
export interface LoaderProps {
  /** Overall width in px. The curve is roughly 3:1, so height follows. */
  size?: number;
  /**
   * `brand` is the green for light surfaces. `onColor` is for sitting inside a
   * filled button, where the brand green would be drawn on top of itself.
   */
  tone?: 'brand' | 'onColor';
  style?: ViewStyle;
}

/** One full circuit of the loop. */
const CYCLE_MS = 1600;

/** Unit lemniscate, sampled once at module load and reused by every loader. */
const PATH = (() => {
  const steps = 64;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const t = (2 * Math.PI * i) / steps;
    const d = 1 + Math.sin(t) ** 2;
    const x = Math.cos(t) / d;
    const y = (Math.sin(t) * Math.cos(t)) / d;
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(4)},${y.toFixed(4)}`);
  }
  return pts.join(' ') + ' Z';
})();

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function Loader({ size = 48, tone = 'brand', style }: LoaderProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: CYCLE_MS,
        easing: Easing.inOut(Easing.sin),
        // The web build has no native animated module, and asking for one logs
        // a warning on every mount before falling back to JS regardless.
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    spin.start();
    return () => spin.stop();
  }, [progress]);

  const height = Math.round(size / 2.6);
  const stroke = Math.max(2, size * 0.055);
  const dot = Math.max(3, size * 0.085);

  const track = tone === 'onColor' ? 'rgba(255,255,255,0.3)' : Colors.secondaryContainer;
  const ink = tone === 'onColor' ? '#ffffff' : Colors.primary;

  // The curve's own length in the unit space above, measured once. The dash
  // pattern below rides along it: one short lit segment, the rest dark.
  const LENGTH = 4.84;
  const lit = LENGTH * 0.12;

  const dashOffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -LENGTH],
  });

  return (
    <View
      style={[styles.wrap, style]}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
    >
      <Svg width={size} height={height} viewBox="-1.15 -0.5 2.3 1">
        {/* The loop itself, faint, so the shape reads even between passes. */}
        <Path
          d={PATH}
          stroke={track}
          strokeWidth={stroke / (size / 2.3)}
          fill="none"
          strokeLinecap="round"
        />
        {/* The travelling segment. */}
        <AnimatedPath
          d={PATH}
          stroke={ink}
          strokeWidth={dot / (size / 2.3)}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${lit} ${LENGTH}`}
          strokeDashoffset={dashOffset as unknown as number}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
