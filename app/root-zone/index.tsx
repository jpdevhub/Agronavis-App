import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Loader } from '@/components/ui';
import { SoilProfile } from '@/components/insight/SoilProfile';
import { Colors, Elevation, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { useGoBack } from '@/hooks/useGoBack';
import { useWeather } from '@/hooks/useWeather';
import { useFarmStore } from '@/store/useFarmStore';
import { type DayRisk, type RiskLevel } from '@/features/insight/fungalRisk';
import { diseaseState, rootZoneState } from '@/features/insight/cardState';

/** Where the root-zone reading sits, in words a farmer can act on. */
function band(v: number) {
  if (v >= 0.6)
    return {
      label: 'Wet',
      ground: Colors.secondaryContainer,
      ink: Colors.onSecondaryContainer,
      meaning: 'There is more water down there than the crop can drink right now.',
    };
  if (v >= 0.35)
    return {
      label: 'Adequate',
      ground: Colors.secondaryContainer,
      ink: Colors.onSecondaryContainer,
      meaning: 'The root zone is holding enough. The crop is not working for its water.',
    };
  if (v >= 0.2)
    return {
      label: 'Drying',
      ground: Colors.tertiaryContainer,
      ink: Colors.onTertiaryContainer,
      meaning: 'Still usable, but falling. Worth planning the next irrigation.',
    };
  return {
    label: 'Dry',
    ground: Colors.errorContainer,
    ink: Colors.onErrorContainer,
    meaning: 'The crop is pulling against the soil to drink. Growth slows here before wilting shows.',
  };
}

const RISK: Record<RiskLevel | 'unknown', { title: string; icon: keyof typeof MaterialIcons.glyphMap; ground: string; ink: string }> = {
  // Not the same as "clear". With no forecast nothing has been checked, and a
  // farmer told their crop is clear will not go and look at the lower leaves.
  unknown: { title: 'Not checked yet', icon: 'help-outline', ground: Colors.surfaceContainerHigh, ink: Colors.onSurface },
  clear: { title: 'No fungal pressure', icon: 'verified', ground: Colors.secondaryContainer, ink: Colors.onSecondaryContainer },
  watch: { title: 'One night worth watching', icon: 'visibility', ground: Colors.tertiaryContainer, ink: Colors.onTertiaryContainer },
  high: { title: 'Fungal conditions building', icon: 'coronavirus', ground: Colors.errorContainer, ink: Colors.onErrorContainer },
};

const weekday = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short' });

function DayRow({ day }: { day: DayRisk }) {
  return (
    <View style={[styles.dayRow, day.risky && styles.dayRowRisky]}>
      <Text style={[styles.dayName, day.risky && styles.dayNameRisky]}>{weekday(day.date)}</Text>

      <View style={styles.dayMid}>
        <Text style={styles.dayHead}>
          {day.leafWet ? 'Dew on the leaves' : 'Leaves stay dry'}
        </Text>
        <Text style={styles.dayNote}>
          Night {Math.round(day.tempMin)}° against a dew point of {Math.round(day.dewPointC)}°
          {day.leafWet && !day.risky ? ' · too cool for the fungus' : ''}
        </Text>
      </View>

      <MaterialIcons
        name={day.risky ? 'warning' : day.leafWet ? 'water-drop' : 'wb-sunny'}
        size={18}
        color={day.risky ? Colors.error : Colors.onSurfaceVariant}
      />
    </View>
  );
}

/**
 * Everything the satellites know about the water in this field's soil, and
 * what that water is about to do to the crop above it.
 *
 * Moisture and fungal risk belong on one page because they are one story: the
 * same humidity that keeps the root zone full is what leaves the canopy wet at
 * dawn. A farmer reading "73% of saturation" should see, on the same screen,
 * whether that is about to cost them a spray.
 */
export default function RootZoneScreen() {
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const farmId = useFarmStore((s) => s.activeFarmId);
  const fieldId = useFarmStore((s) => s.activeFieldId);
  const { data: bundle, forecast, waterDeficitMm, isLoading, refetch } = useWeather(farmId, fieldId);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // POWER runs two to three days behind, so the most recent published day is
  // found rather than assumed to be today, and its date is shown.
  const latest = [...(bundle?.solar ?? [])]
    .reverse()
    .find((d) => typeof d.soilWetnessRoot === 'number' && d.soilWetnessRoot !== null);

  const root = latest?.soilWetnessRoot ?? null;
  const surface = latest?.soilWetnessSurface ?? null;
  // Both decisions come from the tested state module rather than from inline
  // conditions, so every branch on this page is asserted in
  // features/insight/__tests__/cardState.test.ts.
  const zone = rootZoneState({
    hasField: Boolean(fieldId),
    isLoading,
    latest,
    waterDeficitMm,
  });
  const disease = diseaseState({ hasField: Boolean(fieldId), isLoading, forecast });
  const fungal = disease.assessment;
  const risk = RISK[disease.kind === 'no-data' ? 'unknown' : fungal.level];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => goBack()} style={styles.back} hitSlop={8} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Root zone</Text>
          <Text style={styles.subtitle}>Soil water and what it means for disease</Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centre}><Loader size={48} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {/* ── The reading ─────────────────────────────────────────────── */}
          <View style={styles.hero}>
            <SoilProfile surface={surface} root={root} />

            {zone.kind !== 'ready' ? (
              <View style={styles.heroText}>
                <Text style={styles.heroHead}>No reading yet</Text>
                <Text style={styles.heroBody}>
                  NASA has not published soil moisture for this field in the last few days. The
                  irrigation advice below still stands — it is worked out from rainfall and
                  evaporation rather than measured.
                </Text>
              </View>
            ) : (
              <View style={styles.heroText}>
                <View style={styles.heroNumber}>
                  <Text style={styles.pct}>{zone.pct}</Text>
                  <Text style={styles.pctUnit}>% of saturation</Text>
                </View>
                <View style={[styles.chip, { backgroundColor: band(zone.pct! / 100).ground }]}>
                  <Text style={[styles.chipText, { color: band(zone.pct! / 100).ink }]}>
                    {zone.band}
                  </Text>
                </View>
                <Text style={styles.heroBody}>{band(zone.pct! / 100).meaning}</Text>
              </View>
            )}
          </View>

          {/* Two measured depths, because they answer different questions. */}
          {zone.kind === 'ready' ? (
            <View style={styles.layers}>
              <View style={styles.layer}>
                <Text style={styles.layerPct}>
                  {surface === null ? '—' : `${Math.round(surface * 100)}%`}
                </Text>
                <Text style={styles.layerName}>Surface</Text>
                <Text style={styles.layerNote}>Germination and crusting. Dries first.</Text>
              </View>
              <View style={styles.layerDivide} />
              <View style={styles.layer}>
                <Text style={styles.layerPct}>{zone.pct}%</Text>
                <Text style={styles.layerName}>Root zone</Text>
                <Text style={styles.layerNote}>What the crop actually drinks from.</Text>
              </View>
            </View>
          ) : null}

          {/* ── Against the water balance ───────────────────────────────── */}
          {waterDeficitMm !== null && zone.kind === 'ready' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Alongside the irrigation advice</Text>
              <Text style={styles.cardBody}>
                {waterDeficitMm > 0
                  ? `The balance of rain in and evaporation out says this field is ${Math.round(waterDeficitMm)} mm short. `
                  : 'The balance of rain in and evaporation out says this field is not short of water. '}
                {zone.disagreement === 'wetter-than-balance'
                  ? 'The satellite disagrees — it still measures a wet root zone, which usually means recent rain the balance has not caught up with. Dig before you irrigate.'
                  : zone.disagreement === 'drier-than-balance'
                    ? 'The satellite disagrees — it measures dry soil despite the balance looking fine. Trust the spade over both.'
                    : 'The measurement agrees with the calculation.'}
              </Text>
            </View>
          ) : null}

          {/* ── Fungal risk ─────────────────────────────────────────────── */}
          <Text style={styles.section}>Disease watch</Text>

          <View style={[styles.card, { backgroundColor: risk.ground }]}>
            <View style={styles.riskHead}>
              <MaterialIcons name={risk.icon} size={24} color={risk.ink} />
              <Text style={[styles.riskTitle, { color: risk.ink }]}>{risk.title}</Text>
            </View>
            <Text style={[styles.cardBody, { color: risk.ink }]}>
              {disease.kind === 'no-data'
                ? 'No forecast has come back for this field yet, so the coming nights have not been checked. Pull down to try again.'
                : fungal.level === 'clear'
                ? 'Across the next few nights the air stays far enough from its dew point that the leaves should dry, or the days stay too cool for blast and blight to take hold. Nothing to spray for.'
                : fungal.level === 'watch'
                  ? 'One of the coming nights brings dew onto a mild crop. One night rarely starts an infection, but if the next does the same, this becomes worth acting on.'
                  : `On ${fungal.riskyDays.length} of the coming nights the air cools to its dew point and the days stay mild — the conditions blast and blight need. Scout the lower leaves each morning and have a preventive spray ready rather than waiting for lesions.`}
            </Text>
          </View>

          {fungal.days.length > 0 ? (
            <View style={styles.card}>
              {fungal.days.slice(0, 5).map((d) => (
                <DayRow key={d.date} day={d} />
              ))}
            </View>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Why dew and not humidity</Text>
            <Text style={styles.cardBody}>
              Relative humidity swings from 50% to 95% over one day without a drop of extra water
              in the air, because it is a fraction of what the air could hold at whatever
              temperature it happens to be. The dew point barely moves. When the night&apos;s low
              falls to it, the air gives up its water onto the coolest thing around — which is the
              crop. Hours of wet leaf is what a spore needs, so that is the question this page
              asks.
            </Text>
          </View>

          <Text style={styles.footnote}>
            Soil moisture from NASA POWER, which publishes two to three days behind
            {latest ? ` — this reading is from ${latest.date}` : ''}. Night temperature and
            humidity from the five-day forecast. Dew point by Magnus-Tetens.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  back: {
    width: 40, height: 40, borderRadius: Shape.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  headerText: { flex: 1 },
  title: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  subtitle: { ...Type.bodySmall, color: Colors.onSurfaceVariant },

  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: Spacing.lg, gap: Spacing.sm },

  hero: {
    borderRadius: Shape.extraLarge, overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLow, ...Elevation.level1,
  },
  heroText: { padding: Spacing.lg, gap: Spacing.sm },
  heroNumber: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  pct: { ...TypeEmphasized.displayMedium, color: Colors.onSurface },
  pctUnit: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  heroHead: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  heroBody: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, lineHeight: 20 },
  chip: {
    alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Shape.full,
  },
  chipText: { ...TypeEmphasized.labelLarge },

  layers: {
    flexDirection: 'row', alignItems: 'stretch',
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Shape.large,
    padding: Spacing.lg, gap: Spacing.lg,
  },
  layer: { flex: 1, gap: 2 },
  layerDivide: { width: 1, backgroundColor: Colors.outlineVariant },
  layerPct: { ...TypeEmphasized.headlineSmall, color: Colors.onSurface },
  layerName: { ...TypeEmphasized.labelLarge, color: Colors.onSurface },
  layerNote: { ...Type.bodySmall, color: Colors.onSurfaceVariant },

  section: { ...TypeEmphasized.titleMedium, color: Colors.onSurface, marginTop: Spacing.lg },

  card: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Shape.large,
    padding: Spacing.lg, gap: Spacing.sm,
  },
  cardTitle: { ...TypeEmphasized.titleSmall, color: Colors.onSurface },
  cardBody: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, lineHeight: 20 },

  riskHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  riskTitle: { ...TypeEmphasized.titleMedium },

  dayRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dayRowRisky: {},
  dayName: { ...TypeEmphasized.labelLarge, color: Colors.onSurfaceVariant, width: 40 },
  dayNameRisky: { color: Colors.error },
  dayMid: { flex: 1 },
  dayHead: { ...Type.bodyMedium, color: Colors.onSurface },
  dayNote: { ...Type.bodySmall, color: Colors.onSurfaceVariant },

  footnote: {
    ...Type.bodySmall, color: Colors.onSurfaceVariant,
    marginTop: Spacing.md, lineHeight: 18,
  },
});
