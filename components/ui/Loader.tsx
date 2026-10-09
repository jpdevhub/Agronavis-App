import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View, Text, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Spacing, Type } from '@/constants/theme';

/**
 * The app's loading indicator.
 *
 * Two arcs turning against each other rather than one spinning ring: the outer
 * in the app's green, the inner in harvest amber, on a soft track that stays
 * visible so the shape reads as a whole circle even at the start of a turn.
 * Opposed rotation is what makes it legible as *working* rather than merely
 * animated, and the two brand colours keep it ours instead of a system
 * spinner wearing a tint.
 *
 * Driven by the core Animated API with the native driver, the same way
 * Skeleton is: transforms run on the UI thread, so the rings keep turning
 * while JavaScript is busy — which is exactly when a farmer is looking at one.
 * Deliberately not Reanimated worklets; nothing else in the app uses them yet,
 * and a loading indicator is the worst possible place to find out the build is
 * missing a Babel plugin.
 */
export interface LoaderProps {
  /** Diameter in px. 48 is the default; 28 suits a button. */
  size?: number;
  /** Optional line beneath, for full-screen use. */
  label?: string;
  /**
   * `brand` is the green-and-amber pair for light surfaces. `onColor` is for
   * sitting inside a filled button, where the brand green would be drawing
   * itself on top of itself.
   */
  tone?: 'brand' | 'onColor';
  style?: ViewStyle;
}

const STROKE_RATIO = 0.085;
const OUTER_MS = 1400;
const INNER_MS = 1900;

export function Loader({ size = 48, label, tone = 'brand', style }: LoaderProps) {
  const outer = useRef(new Animated.Value(0)).current;
  const inner = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spin = (value: Animated.Value, duration: number) =>
      Animated.loop(
        Animated.timing(value, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          // The web build has no native animated module, and asking for one
          // logs a warning on every mount before falling back to JS anyway.
          useNativeDriver: Platform.OS !== 'web',
        }),
      );
    // Slower, and the other way, so the two never lock into one shape.
    const a = spin(outer, OUTER_MS);
    const b = spin(inner, INNER_MS);
    a.start();
    b.start();
    return () => {
      a.stop();
      b.stop();
    };
  }, [outer, inner]);

  const outerStyle = {
    transform: [
      { rotate: outer.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) },
    ],
  };
  const innerStyle = {
    transform: [
      { rotate: inner.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] }) },
    ],
  };

  const onColor = tone === 'onColor';
  const trackColor = onColor ? '#ffffff' : Colors.secondaryContainer;
  const arcColor = onColor ? '#ffffff' : Colors.primary;
  const accentColor = onColor ? Colors.primaryFixed : Colors.tertiaryContainer;

  const stroke = Math.max(2, size * STROKE_RATIO);
  const rOuter = (size - stroke) / 2;
  const rInner = rOuter - stroke * 2.1;
  const cOuter = 2 * Math.PI * rOuter;
  const cInner = 2 * Math.PI * rInner;

  return (
    <View style={[styles.wrap, style]} accessibilityRole="progressbar" accessibilityLabel={label ?? 'Loading'}>
      <View style={{ width: size, height: size }}>
        {/* The track. Drawn once and never animated, so the ring keeps its
            shape while the arcs are away. */}
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={rOuter}
            stroke={trackColor}
            strokeWidth={stroke}
            fill="none"
            opacity={onColor ? 0.3 : 0.45}
          />
        </Svg>

        <Animated.View style={[StyleSheet.absoluteFill, outerStyle]}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={rOuter}
              stroke={arcColor}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${cOuter * 0.3} ${cOuter}`}
            />
          </Svg>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, innerStyle]}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={rInner}
              stroke={accentColor}
              strokeWidth={stroke * 0.8}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${cInner * 0.18} ${cInner}`}
            />
          </Svg>
        </Animated.View>
      </View>

      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  label: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
