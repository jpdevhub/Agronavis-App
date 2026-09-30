import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { MicronutrientSpread, NutrientSpread, SoilReport } from '@agronavis/shared-types';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { soilApi } from '@/services/endpoints';

const pct = (part: number, total: number): number => (total > 0 ? (part / total) * 100 : 0);

/**
 * Below this the distribution is noise. Ludhiana has ten samples in the current
 * cycle and none in earlier ones, and "Low nitrogen" off ten tests must not read
 * with the same authority as the same words off thirty-four thousand.
 */
const SPARSE_SAMPLES = 100;
const fmt = (n: number): string => n.toLocaleString('en-IN');

/** Soil Health Card ratings, in the order the card itself prints them. */
const BANDS = [
  { key: 'high', label: 'High', colour: Colors.primary },
  { key: 'medium', label: 'Medium', colour: Colors.tertiaryContainer },
  { key: 'low', label: 'Low', colour: Colors.error },
] as const;

function dominant(spread: NutrientSpread): string {
  const { high, medium, low } = spread;
  if (high >= medium && high >= low) return 'High';
  if (medium >= high && medium >= low) return 'Medium';
  return 'Low';
}

/**
 * How clear-cut the rating is. Meghalaya's phosphorus splits 44/44 between High
 * and Medium — printing "High" alone would hide a coin toss.
 */
function margin(spread: NutrientSpread): number {
  const sorted = [spread.high, spread.medium, spread.low].sort((a, b) => b - a);
  const total = sorted.reduce((a, b) => a + b, 0);
  return pct(sorted[0] - sorted[1], total);
}

function NutrientRow({ name, spread }: { name: string; spread: NutrientSpread }) {
  const total = spread.high + spread.medium + spread.low;
  const close = margin(spread) < 10;

  return (
    <View style={styles.nutrient}>
      <View style={styles.nutrientHead}>
        <Text style={styles.nutrientName}>{name}</Text>
        <Text style={styles.nutrientVerdict}>{dominant(spread)}</Text>
      </View>

      <View style={styles.bar}>
        {BANDS.map((band) => {
          const share = pct(spread[band.key], total);
          if (share <= 0) return null;
          return (
            <View
              key={band.key}
              style={[styles.barSegment, { flex: share, backgroundColor: band.colour }]}
            />
          );
        })}
      </View>

      <View style={styles.legend}>
        {BANDS.map((band) => (
          <View key={band.key} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: band.colour }]} />
            <Text style={styles.legendText}>
              {band.label} {Math.round(pct(spread[band.key], total))}%
            </Text>
          </View>
        ))}
      </View>

      {close && (
        <Text style={styles.closeCall}>
          Close call — the top two ratings are within 10% of each other.
        </Text>
      )}
    </View>
  );
}

function MicroRow({ name, spread }: { name: string; spread: MicronutrientSpread }) {
  const total = spread.sufficient + spread.deficient;
  const deficient = Math.round(pct(spread.deficient, total));
  if (total === 0) return null;

  return (
    <View style={styles.microRow}>
      <Text style={styles.microName}>{name}</Text>
      <View style={styles.microBar}>
        <View style={[styles.microFill, { width: `${deficient}%` }]} />
      </View>
      <Text style={[styles.microPct, deficient >= 40 && styles.microPctHigh]}>{deficient}%</Text>
    </View>
  );
}

export default function SoilReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fieldId, farmId, state, district } = useLocalSearchParams<{
    fieldId?: string;
    farmId?: string;
    state?: string;
    district?: string;
  }>();

  const query = useQuery<SoilReport | null>({
    queryKey: ['soil', 'report', fieldId, farmId, state, district],
    queryFn: () => soilApi.report({ fieldId, farmId, state, district }),
    enabled: Boolean(fieldId ?? farmId ?? state),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const report = query.data ?? null;

  const place = useMemo(() => {
    if (!report) return [district, state].filter(Boolean).join(', ') || 'this farm';
    return report.district ? `${report.district}, ${report.state}` : report.state;
  }, [report, district, state]);

  const phTotal = report ? report.ph.alkaline + report.ph.acidic + report.ph.neutral : 0;
  const ecTotal = report ? report.ec.saline + report.ec.nonSaline : 0;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Soil health</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{place}</Text>
        </View>
      </View>

      {query.isLoading ? (
        <View style={styles.centre}><ActivityIndicator color={Colors.primary} /></View>
      ) : !report ? (
        <View style={styles.centre}>
          <MaterialIcons name="science" size={40} color={Colors.onSurfaceVariant} />
          <Text style={styles.emptyTitle}>No Soil Health Card data</Text>
          <Text style={styles.emptyBody}>
            The scheme has not published figures for {place} yet. A soil test recorded against your
            field will still show here.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + Spacing.xxl }]}
        >
          <View style={styles.provenance}>
            <Text style={styles.provenanceLine}>
              {report.scope === 'district'
                ? `District figures${report.cycle ? ` · cycle ${report.cycle}` : ''}`
                : `State average of ${report.districtsCovered} districts`}
            </Text>
            <Text style={styles.provenanceLine}>
              {fmt(report.samples)} soil samples · Soil Health Card, Department of Agriculture &
              Farmers Welfare
            </Text>
            {report.scope === 'state' && (
              <Text style={styles.provenanceWarn}>
                No figures published for your district, so this averages the whole state. Treat it
                as a rough guide.
              </Text>
            )}
            {report.samples < SPARSE_SAMPLES && (
              <Text style={styles.provenanceWarn}>
                Only {fmt(report.samples)} sample{report.samples === 1 ? '' : 's'} have been
                collected here, too few to rely on. A soil test on your own field is worth far more
                than this.
              </Text>
            )}
          </View>

          <Text style={styles.section}>Macronutrients</Text>
          <View style={styles.card}>
            <NutrientRow name="Nitrogen (N)" spread={report.macro.nitrogen} />
            <NutrientRow name="Phosphorus (P)" spread={report.macro.phosphorus} />
            <NutrientRow name="Potassium (K)" spread={report.macro.potassium} />
            <NutrientRow name="Organic carbon" spread={report.macro.organicCarbon} />
          </View>

          <Text style={styles.section}>Micronutrients deficient</Text>
          <View style={styles.card}>
            <MicroRow name="Sulphur (S)" spread={report.micro.sulphur} />
            <MicroRow name="Iron (Fe)" spread={report.micro.iron} />
            <MicroRow name="Zinc (Zn)" spread={report.micro.zinc} />
            <MicroRow name="Copper (Cu)" spread={report.micro.copper} />
            <MicroRow name="Boron (B)" spread={report.micro.boron} />
            <MicroRow name="Manganese (Mn)" spread={report.micro.manganese} />
          </View>

          <Text style={styles.section}>Reaction and salinity</Text>
          <View style={styles.card}>
            <View style={styles.pairRow}>
              <Text style={styles.pairLabel}>pH</Text>
              <Text style={styles.pairValue}>
                {Math.round(pct(report.ph.neutral, phTotal))}% neutral ·{' '}
                {Math.round(pct(report.ph.acidic, phTotal))}% acidic ·{' '}
                {Math.round(pct(report.ph.alkaline, phTotal))}% alkaline
              </Text>
            </View>
            <View style={styles.pairRow}>
              <Text style={styles.pairLabel}>Salinity</Text>
              <Text style={styles.pairValue}>
                {Math.round(pct(report.ec.nonSaline, ecTotal))}% non-saline ·{' '}
                {Math.round(pct(report.ec.saline, ecTotal))}% saline
              </Text>
            </View>
          </View>

          <Text style={styles.footnote}>
            These are district-wide sample distributions, not a test of your field. A soil test
            recorded against your field replaces them with figures for your own land.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  fill: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1 },
  title: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  subtitle: { ...Type.bodySmall, color: Colors.onSurfaceVariant },

  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xxl },
  emptyTitle: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  emptyBody: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center' },

  body: { padding: Spacing.lg, gap: Spacing.md },

  provenance: {
    gap: Spacing.xs, padding: Spacing.md,
    borderRadius: Shape.large, backgroundColor: Colors.surfaceContainerLow,
  },
  provenanceLine: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  provenanceWarn: { ...Type.bodySmall, color: Colors.tertiary, marginTop: Spacing.xs },

  section: { ...TypeEmphasized.titleMedium, color: Colors.onSurface, marginTop: Spacing.sm },
  card: {
    gap: Spacing.lg, padding: Spacing.md,
    borderRadius: Shape.large, backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },

  nutrient: { gap: Spacing.sm },
  nutrientHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  nutrientName: { ...Type.bodyLarge, color: Colors.onSurface },
  nutrientVerdict: { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
  bar: { flexDirection: 'row', height: 10, borderRadius: Shape.full, overflow: 'hidden' },
  barSegment: { height: '100%' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  dot: { width: 8, height: 8, borderRadius: Shape.full },
  legendText: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  closeCall: { ...Type.bodySmall, color: Colors.tertiary },

  microRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  microName: { ...Type.bodyMedium, color: Colors.onSurface, width: 128 },
  microBar: {
    flex: 1, height: 8, borderRadius: Shape.full,
    backgroundColor: Colors.surfaceContainerHigh, overflow: 'hidden',
  },
  microFill: { height: '100%', backgroundColor: Colors.error, borderRadius: Shape.full },
  microPct: { ...Type.bodySmall, color: Colors.onSurfaceVariant, width: 40, textAlign: 'right' },
  microPctHigh: { ...TypeEmphasized.bodyMedium, color: Colors.error },

  pairRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  pairLabel: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, width: 72 },
  pairValue: { ...Type.bodyMedium, color: Colors.onSurface, flex: 1 },

  footnote: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: Spacing.sm },
});
