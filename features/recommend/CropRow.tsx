import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CropSuggestion } from '@agronavis/shared-types';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { rupees } from './formatting';

/**
 * One crop in the ranked list.
 *
 * Takes everything it draws, so it can be used by the field list and the
 * state sheet without either knowing about the other. The bar is the fit
 * score rather than the money: two crops can earn the same and suit the
 * field very differently, and the fit is what the farmer is choosing on.
 */

const INITIAL: Record<CropSuggestion['category'], string> = {
  cereal: '#C9A227', pulse: '#7A8450', oilseed: '#C8732B', vegetable: '#3E8E5A',
  fruit: '#C2453F', spice: '#B5651D', fibre: '#4A7BA7', other: '#6B7280',
};

export const CropRow = memo(function CropRow({
  crop,
  label,
  selected,
  onPress,
}: {
  crop: CropSuggestion;
  /** The scheme's own wording, which names the variety and season. */
  label?: string;
  selected?: boolean;
  onPress: (crop: CropSuggestion) => void;
}) {
  const tint = INITIAL[crop.category];

  return (
    <Pressable
      style={[styles.row, selected && styles.rowSelected]}
      onPress={() => onPress(crop)}
      accessibilityRole="button"
      accessibilityLabel={`${crop.crop}, ${crop.fit} out of 100 for this field`}
    >
      <View style={[styles.badge, { backgroundColor: `${tint}22` }]}>
        <Text style={[styles.badgeText, { color: tint }]}>
          {crop.crop.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {label ?? crop.crop.charAt(0).toUpperCase() + crop.crop.slice(1)}
          </Text>
          {!crop.sowableNow ? <Text style={styles.later}>later</Text> : null}
        </View>

        <View style={styles.track}>
          <View style={[styles.fill, { width: `${crop.fit}%`, backgroundColor: tint }]} />
        </View>

        {/* The first caution only. The rest are on the crop's own sheet —
            a list of five warnings per row is a list nobody reads. */}
        <Text style={styles.sub} numberOfLines={1}>
          {crop.cautions[0] ?? `${crop.durationDays} days to harvest`}
        </Text>
      </View>

      <View style={styles.money}>
        <Text style={styles.amount}>
          {crop.estimatedProfit === null ? '—' : rupees(crop.estimatedProfit)}
        </Text>
        <Text style={styles.per}>{crop.estimatedProfit === null ? 'no price' : 'est. profit'}</Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Shape.large, padding: Spacing.lg, minHeight: 76,
    borderWidth: 1, borderColor: 'transparent',
  },
  rowSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryFixed },
  badge: {
    width: 40, height: 40, borderRadius: Shape.full,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { ...TypeEmphasized.titleMedium },
  body: { flex: 1, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { ...TypeEmphasized.titleSmall, color: Colors.onSurface, flexShrink: 1 },
  later: {
    ...Type.labelSmall, color: Colors.onTertiaryContainer,
    backgroundColor: Colors.tertiaryContainer,
    paddingHorizontal: Spacing.sm, paddingVertical: 1, borderRadius: Shape.full,
  },
  track: {
    height: 4, borderRadius: Shape.full,
    backgroundColor: Colors.surfaceContainerHigh, overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: Shape.full },
  sub: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  money: { alignItems: 'flex-end' },
  amount: { ...TypeEmphasized.titleSmall, color: Colors.onSurface },
  per: { ...Type.labelSmall, color: Colors.onSurfaceVariant },
});
