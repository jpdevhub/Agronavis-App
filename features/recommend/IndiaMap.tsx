import { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { geoMercator, geoPath } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import { Colors } from '@/constants/theme';

/**
 * India by state, drawn as paths rather than tiles.
 *
 * No map service and no key: the outline is a file in the bundle, so it draws
 * in a field with no signal and costs nothing per view. A state outline at
 * phone size needs no more detail than this.
 *
 * Knows nothing about crops. It takes which states to mark and reports which
 * was tapped, so the same map serves the browse screen and anything later.
 *
 * Boundaries are Survey of India's own — see `assets/geo/README.md`. They are
 * not interchangeable with a community file.
 */

export interface MapState {
  name: string;
  /** Drawn filled: the states this farmer has a field in. */
  highlighted?: boolean;
}

/**
 * Required rather than imported, so the 200 KB of geometry is read when the
 * map first mounts instead of at every app launch.
 */
function useIndia(): FeatureCollection<Geometry, { name: string }> {
  return useMemo(
    () => require('@/assets/geo/india-states.json') as FeatureCollection<Geometry, { name: string }>,
    [],
  );
}

export function IndiaMap({
  states,
  selected,
  onSelect,
  height,
}: {
  states: MapState[];
  selected: string | null;
  onSelect: (state: string) => void;
  height?: number;
}) {
  const india = useIndia();
  const { width: screenWidth } = useWindowDimensions();

  const width = screenWidth;
  // India is taller than it is wide; this keeps Kanyakumari and Kashmir both
  // on screen without letterboxing the middle.
  const mapHeight = height ?? Math.round(width * 1.1);

  const paths = useMemo(() => {
    const projection = geoMercator().fitSize([width, mapHeight], india);
    const toPath = geoPath(projection);
    return india.features
      .map((feature) => ({ name: feature.properties.name, d: toPath(feature) }))
      .filter((p): p is { name: string; d: string } => Boolean(p.d));
  }, [india, width, mapHeight]);

  const marked = useMemo(
    () => new Set(states.filter((s) => s.highlighted).map((s) => s.name)),
    [states],
  );

  return (
    <View style={[styles.wrap, { height: mapHeight }]}>
      <Svg width={width} height={mapHeight}>
        <G>
          {paths.map(({ name, d }) => {
            const isSelected = name === selected;
            const isMine = marked.has(name);
            return (
              <Path
                key={name}
                d={d}
                fill={
                  isSelected ? Colors.primary : isMine ? Colors.primaryFixed : Colors.surfaceContainerLow
                }
                stroke={isSelected ? Colors.primary : Colors.outlineVariant}
                strokeWidth={isSelected ? 1.6 : 0.6}
                onPress={() => onSelect(name)}
                // Every state is tappable, including the ones with no field.
                accessible
                accessibilityLabel={name}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', backgroundColor: Colors.surface },
});
