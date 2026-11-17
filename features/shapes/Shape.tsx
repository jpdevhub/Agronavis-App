import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { shapePath, type ShapeName } from './geometry';

/**
 * One Expressive shape, filled, with its content centred on top.
 *
 * The silhouette is the point, so the SVG sits behind rather than clipping:
 * clipping a view to a path costs a layer on Android and gains nothing when
 * the child is a letter or an icon.
 */
export function Shape({
  name,
  size,
  color,
  children,
  style,
}: {
  name: ShapeName;
  size: number;
  color: string;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[{ width: size, height: size }, styles.wrap, style]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Path d={shapePath(name, size)} fill={color} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
