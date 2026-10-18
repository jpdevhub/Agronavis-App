import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Camera, ImageSource, MapView, RasterLayer, ShapeSource, LineLayer, UserLocation } from '@rnmapbox/maps';
import { mapsReady } from '@/features/maps/init';
import { Loader, NavScrim } from '@/components/ui';
import { Colors, Elevation, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { Env } from '@/constants/env';
import { useGoBack } from '@/hooks/useGoBack';
import { useNdvi } from '@/hooks/useSatellite';
import { useFarmFields } from '@/hooks/useFarmFields';
import { useFarmStore } from '@/store/useFarmStore';
import { vigourState } from '@/features/insight/cardState';
import { useHeatmapFile } from '@/features/insight/heatmapFile';

const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';

/** The same anchors the heatmap is coloured from, for the legend. */
const LEGEND: [string, string][] = [
  ['#a5714e', 'Bare'],
  ['#d6b776', 'Sparse'],
  ['#e0d76c', 'Patchy'],
  ['#7abd5a', 'Growing'],
  ['#1f7836', 'Dense'],
];

const shortDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/**
 * What the satellite sees growing on this field.
 *
 * The map underneath is Mapbox's own imagery, which carries no date and does
 * not change — it is there to show where the field is. The coloured square on
 * top is the part that is actually current: NDVI from the most recent clear
 * Sentinel-2 pass, one block per 10 m of ground.
 *
 * Blocky on purpose. Sentinel-2 resolves 10 m, so a one-acre field is about
 * six blocks across; smoothing it would imply a precision the satellite does
 * not have.
 */
export default function CropHealthScreen() {
  const goBack = useGoBack();
  const insets = useSafeAreaInsets();
  const fieldId = useFarmStore((s) => s.activeFieldId);
  const farmId = useFarmStore((s) => s.activeFarmId);
  const ndvi = useNdvi();
  const { data: fields } = useFarmFields();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await ndvi.refetch();
    setRefreshing(false);
  }, [ndvi]);

  // Mapbox's native ImageSource cannot load a data URI, so the PNG the API
  // sent is written to a file first. Null until that is done.
  const heatmapUri = useHeatmapFile(ndvi.heatmap, ndvi.latest?.date ?? null);

  const field = fields?.find((f: { id: string }) => f.id === fieldId);
  const state = vigourState({
    hasField: Boolean(fieldId),
    isLoading: ndvi.isLoading,
    available: ndvi.available,
    latest: ndvi.latest,
    change: ndvi.change,
  });

  // The drawn boundary, if this field has one, to sit over the heatmap.
  const outline = field?.polygon
    ? { type: 'Feature' as const, properties: {}, geometry: field.polygon as never }
    : null;

  const centre = ndvi.bounds
    ? ([
        (ndvi.bounds[0]![0] + ndvi.bounds[2]![0]) / 2,
        (ndvi.bounds[0]![1] + ndvi.bounds[2]![1]) / 2,
      ] as [number, number])
    : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => goBack()} style={styles.back} hitSlop={8} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Crop health</Text>
          <Text style={styles.subtitle}>
            {state.measuredOn ? `Sentinel-2, ${shortDate(state.measuredOn)}` : 'Sentinel-2, 10 m'}
          </Text>
        </View>
      </View>

      {ndvi.isLoading ? (
        <View style={styles.centre}><Loader size={48} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {/* ── The field, with the reading laid over it ───────────────── */}
          <View style={styles.mapCard}>
            {centre && mapsReady ? (
              <MapView
                style={styles.map}
                styleURL={SATELLITE_STYLE}
                scaleBarEnabled={false}
                logoEnabled={false}
                attributionEnabled={false}
              >
                <UserLocation visible androidRenderMode="normal" />
                <Camera centerCoordinate={centre} zoomLevel={15.5} animationDuration={0} />

                {heatmapUri && ndvi.bounds ? (
                  <ImageSource
                    id="ndvi"
                    coordinates={ndvi.bounds as never}
                    url={heatmapUri}
                  >
                    <RasterLayer
                      id="ndvi-layer"
                      sourceID="ndvi"
                      style={{ rasterOpacity: 0.78, rasterResampling: 'nearest' }}
                    />
                  </ImageSource>
                ) : null}

                {outline ? (
                  <ShapeSource id="field" shape={outline}>
                    <LineLayer
                      id="field-line"
                      style={{ lineColor: '#ffffff', lineWidth: 2.5, lineOpacity: 0.9 }}
                    />
                  </ShapeSource>
                ) : null}
              </MapView>
            ) : (
              <View style={[styles.map, styles.mapEmpty]}>
                <MaterialIcons name="satellite-alt" size={28} color={Colors.onSurfaceVariant} />
                <Text style={styles.cardBody}>
                  {state.kind === 'no-data'
                    ? 'No pass has been measured for this field yet.'
                    : 'Map a field to see it from orbit.'}
                </Text>
              </View>
            )}
          </View>

          {/* ── The legend, which the colours mean nothing without ─────── */}
          <View style={styles.legend}>
            {LEGEND.map(([colour, label]) => (
              <View key={label} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: colour }]} />
                <Text style={styles.legendText}>{label}</Text>
              </View>
            ))}
          </View>

          {/* ── The number ─────────────────────────────────────────────── */}
          {state.kind === 'ready' ? (
            <View style={styles.hero}>
              <View style={styles.heroNumber}>
                <Text style={styles.ndvi}>{state.ndvi!.toFixed(2)}</Text>
                <Text style={styles.ndviUnit}>NDVI · {state.band}</Text>
              </View>
              {state.changePercent !== null ? (
                <View style={[styles.chip, state.falling && styles.chipAlarm]}>
                  <MaterialIcons
                    name={state.changePercent >= 0 ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={state.falling ? Colors.onErrorContainer : Colors.onSecondaryContainer}
                  />
                  <Text style={[styles.chipText, state.falling && styles.chipTextAlarm]}>
                    {state.changePercent > 0 ? '+' : ''}{state.changePercent}% since last pass
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardBody}>
                {state.kind === 'unavailable'
                  ? 'Could not fetch the readings just now. Pull down to try again.'
                  : state.kind === 'no-field'
                    ? 'Draw where your crop grows and this will show how much of it is actually standing there, measured from orbit every few days.'
                    : 'No pass has been measured for this field yet. Sentinel-2 comes round about every five days, and a cloudy pass is skipped.'}
              </Text>
            </View>
          )}

          {state.falling ? (
            <View style={[styles.card, styles.cardAlarm]}>
              <Text style={styles.cardTitleAlarm}>Worth walking the field</Text>
              <Text style={styles.cardBodyAlarm}>
                The canopy is thinner than it was at the last pass. That can be pest damage, a
                water shortage, or disease taking hold — all of which show from orbit before they
                are obvious from the gate.
              </Text>
            </View>
          ) : null}

          {/* ── The season so far ──────────────────────────────────────── */}
          {ndvi.history.length > 1 ? (
            <>
              <Text style={styles.section}>Every pass</Text>
              <View style={styles.card}>
                {ndvi.history.map((h) => (
                  <View key={h.date} style={styles.row}>
                    <Text style={styles.rowDate}>{shortDate(h.date)}</Text>
                    <View style={styles.rowBarWrap}>
                      <View
                        style={[
                          styles.rowBar,
                          {
                            width: `${Math.max(3, Math.min(100, h.ndvi * 100))}%`,
                            backgroundColor: LEGEND[Math.min(
                              LEGEND.length - 1,
                              Math.max(0, Math.floor(h.ndvi / 0.2)),
                            )]![0],
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.rowValue}>{h.ndvi.toFixed(2)}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>What this measures</Text>
            <Text style={styles.cardBody}>
              A healthy leaf reflects near-infrared light hard and absorbs red light to
              photosynthesise. NDVI is the gap between those two, so it rises with living, growing
              tissue — bare soil sits near 0.15, a closed canopy past 0.6.
            </Text>
            <Text style={styles.cardBody}>
              The number on its own means less than the change. 0.4 is excellent for a seedling and
              alarming for a crop about to be harvested, so what matters is the direction between
              two passes a few days apart.
            </Text>
          </View>

          <Text style={styles.footnote}>
            Sentinel-2 at 10 m, from the European Space Agency via the Copernicus open data
            programme. Revisits about every five days; cloudy passes are skipped, so a gap in the
            list usually means a gap in the weather.
            The map beneath is Mapbox imagery, which carries no date.
          </Text>
        </ScrollView>
      )}
      <NavScrim />
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

  mapCard: {
    height: 280, borderRadius: Shape.extraLarge, overflow: 'hidden',
    backgroundColor: Colors.surfaceContainerLow, ...Elevation.level1,
  },
  map: { flex: 1 },
  mapEmpty: { alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.lg },

  legend: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Shape.large,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  legendItem: { alignItems: 'center', gap: 4 },
  legendSwatch: { width: 26, height: 10, borderRadius: 3 },
  legendText: { ...Type.labelSmall, color: Colors.onSurfaceVariant },

  hero: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Shape.large,
    padding: Spacing.lg, gap: Spacing.sm,
  },
  heroNumber: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  ndvi: { ...TypeEmphasized.displaySmall, color: Colors.onSurface },
  ndviUnit: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    alignSelf: 'flex-start', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Shape.full, backgroundColor: Colors.secondaryContainer,
  },
  chipAlarm: { backgroundColor: Colors.errorContainer },
  chipText: { ...TypeEmphasized.labelLarge, color: Colors.onSecondaryContainer },
  chipTextAlarm: { color: Colors.onErrorContainer },

  section: { ...TypeEmphasized.titleMedium, color: Colors.onSurface, marginTop: Spacing.lg },

  card: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Shape.large,
    padding: Spacing.lg, gap: Spacing.sm,
  },
  cardAlarm: { backgroundColor: Colors.errorContainer },
  cardTitle: { ...TypeEmphasized.titleSmall, color: Colors.onSurface },
  cardTitleAlarm: { ...TypeEmphasized.titleSmall, color: Colors.onErrorContainer },
  cardBody: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, lineHeight: 20 },
  cardBodyAlarm: { ...Type.bodyMedium, color: Colors.onErrorContainer, lineHeight: 20 },

  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xs },
  rowDate: { ...Type.labelLarge, color: Colors.onSurfaceVariant, width: 56 },
  rowBarWrap: { flex: 1, height: 10, borderRadius: 5, backgroundColor: Colors.surfaceContainerHigh, overflow: 'hidden' },
  rowBar: { height: '100%', borderRadius: 5 },
  rowValue: { ...TypeEmphasized.labelLarge, color: Colors.onSurface, width: 42, textAlign: 'right' },

  footnote: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: Spacing.md, lineHeight: 18 },
});
