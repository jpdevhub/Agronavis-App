import { View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { Colors } from '@/constants/theme';

/**
 * A cross-section through the farmer's own soil, drawn from the two readings
 * NASA published for it.
 *
 * This is a diagram, not a photograph and not a generated image: every part of
 * it is a consequence of `surface` and `root`. The water in each band fills to
 * the measured fraction, so a dry field renders visibly dry. Nothing here is
 * decoration standing in for data.
 *
 * The surface band is the top few centimetres — what matters for germination
 * and crusting, and what dries first. The root band is the zone the crop
 * actually drinks from.
 */
export function SoilProfile({
  surface,
  root,
  height = 190,
}: {
  /** 0–1 fraction of saturation, or null when POWER published none. */
  surface: number | null;
  root: number | null;
  height?: number;
}) {
  const W = 320;
  const H = height;

  const SKY = H * 0.17;
  const TOP_START = SKY;
  const TOP_END = SKY + (H - SKY) * 0.28;
  const ROOT_END = H;

  // Water fills each band from its floor upward, in proportion to the reading.
  const topFrac = surface ?? 0;
  const rootFrac = root ?? 0;
  const topBandH = TOP_END - TOP_START;
  const rootBandH = ROOT_END - TOP_END;

  return (
    <View accessible accessibilityLabel={
      root == null
        ? 'Soil cross-section, no reading available'
        : `Soil cross-section. Root zone ${Math.round(rootFrac * 100)} percent of saturation.`
    }>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.surfaceContainerHighest} />
            <Stop offset="1" stopColor={Colors.surfaceContainerHigh} />
          </LinearGradient>
          <LinearGradient id="water" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.55" />
            <Stop offset="1" stopColor={Colors.primary} stopOpacity="0.9" />
          </LinearGradient>
        </Defs>

        <Rect x="0" y="0" width={W} height={SKY} fill="url(#sky)" />

        {/* Soil bands, dry tone first; water is painted over them. */}
        <Rect x="0" y={TOP_START} width={W} height={topBandH} fill={Colors.tertiaryContainer} opacity={0.35} />
        <Rect x="0" y={TOP_END} width={W} height={rootBandH} fill={Colors.tertiaryContainer} opacity={0.22} />

        {topFrac > 0 ? (
          <Rect
            x="0" y={TOP_END - topBandH * topFrac}
            width={W} height={topBandH * topFrac}
            fill="url(#water)"
          />
        ) : null}
        {rootFrac > 0 ? (
          <Rect
            x="0" y={ROOT_END - rootBandH * rootFrac}
            width={W} height={rootBandH * rootFrac}
            fill="url(#water)"
          />
        ) : null}

        {/* Ground line and the boundary between the two measured zones. */}
        <Rect x="0" y={TOP_START - 1} width={W} height={2} fill={Colors.outline} opacity={0.5} />
        <Rect x="0" y={TOP_END} width={W} height={1} fill={Colors.outline} opacity={0.35} />

        {/* A plant, rooted into the zone the lower reading describes. */}
        <G stroke={Colors.onSurfaceVariant} strokeWidth="1.6" fill="none" opacity={0.75}>
          <Path d={`M160 ${TOP_START} L160 ${TOP_START - SKY * 0.62}`} />
          <Path d={`M160 ${TOP_START - SKY * 0.3} C 140 ${TOP_START - SKY * 0.5}, 134 ${TOP_START - SKY * 0.78}, 150 ${TOP_START - SKY * 0.84}`} />
          <Path d={`M160 ${TOP_START - SKY * 0.42} C 180 ${TOP_START - SKY * 0.6}, 188 ${TOP_START - SKY * 0.88}, 171 ${TOP_START - SKY * 0.95}`} />
        </G>

        <G stroke={Colors.onSurfaceVariant} strokeWidth="1.3" fill="none" opacity={0.5}>
          <Path d={`M160 ${TOP_START} L160 ${TOP_END + rootBandH * 0.72}`} />
          <Path d={`M160 ${TOP_END - topBandH * 0.3} C 142 ${TOP_END + rootBandH * 0.1}, 132 ${TOP_END + rootBandH * 0.3}, 126 ${TOP_END + rootBandH * 0.55}`} />
          <Path d={`M160 ${TOP_END + rootBandH * 0.08} C 180 ${TOP_END + rootBandH * 0.2}, 192 ${TOP_END + rootBandH * 0.4}, 197 ${TOP_END + rootBandH * 0.64}`} />
          <Path d={`M160 ${TOP_END + rootBandH * 0.35} C 150 ${TOP_END + rootBandH * 0.5}, 146 ${TOP_END + rootBandH * 0.62}, 148 ${TOP_END + rootBandH * 0.8}`} />
        </G>

        {/* Sun, so the band above the ground reads as sky rather than as a third layer. */}
        <Circle cx={W - 42} cy={SKY * 0.46} r={SKY * 0.3} fill={Colors.tertiary} opacity={0.5} />
      </Svg>
    </View>
  );
}
