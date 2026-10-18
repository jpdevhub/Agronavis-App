import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/useGoBack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { NearbyFire } from '@agronavis/shared-types';
import { EmptyState, Loader, NavScrim } from '@/components/ui';
import { Colors, Elevation, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { useFarmFires, useFireSummary } from '@/hooks/useFires';

/** A day count as a farmer would say it, not as the API counts it. */
function windowText(days: number | undefined): string {
  const d = days ?? 0;
  if (d >= 150) return 'the last six months';
  if (d >= 50) return `the last ${Math.round(d / 30)} months`;
  if (d >= 13) return `the last ${Math.round(d / 7)} weeks`;
  if (d <= 1) return 'the last day';
  return `the last ${d} days`;
}

/** "2 hours ago" rather than a timestamp a farmer has to subtract from. */
function sinceText(iso: string | null | undefined): string {
  if (!iso) return 'a short while ago';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (!Number.isFinite(mins) || mins < 0) return 'a short while ago';
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/** Compass point for a bearing, which reads faster than degrees. */
const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const compass = (deg: number): string => COMPASS[Math.round(deg / 45) % 8]!;

/**
 * Brightness as plain words.
 *
 * FIRMS reports the fire pixel's temperature in kelvin. A farmer does not
 * think in kelvin, but the difference between a smouldering field and one
 * fully alight is worth showing, because it is the difference between a haze
 * and a day indoors.
 */
function intensity(k: number): string {
  if (k >= 360) return 'Burning hard';
  if (k >= 330) return 'Well alight';
  if (k > 0) return 'Smouldering';
  return 'Detected';
}

function FireRow({ fire }: { fire: NearbyFire }) {
  const when = `${fire.acquiredDate} ${(fire.acquiredTime || '0000').padStart(4, '0').replace(/(\d{2})(\d{2})/, '$1:$2')} UTC`;
  return (
    <View style={[styles.fireRow, fire.upwind && styles.fireRowUpwind]}>
      <View style={styles.fireDist}>
        <Text style={styles.fireKm}>{Math.round(fire.distanceKm)}</Text>
        <Text style={styles.fireKmUnit}>km</Text>
      </View>
      <View style={styles.fireText}>
        <Text style={styles.fireHead}>
          {compass(fire.bearingDeg)} of you{fire.region ? ` · ${fire.region}` : ''}
        </Text>
        <Text style={styles.fireSub}>
          {intensity(fire.brightnessK)} · seen {when}
        </Text>
      </View>
      {fire.upwind ? (
        <View style={styles.upwindTag}>
          <MaterialIcons name="air" size={14} color={Colors.onErrorContainer} />
          <Text style={styles.upwindTagText}>Upwind</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function FiresScreen() {
  const goBack = useGoBack('/(tabs)/dashboard');
  const insets = useSafeAreaInsets();
  // Six months of history. FIRMS itself answers five days at a time, so the
  // older part is served from what the poller and the backfill have stored.
  const near = useFarmFires();
  const [showAll, setShowAll] = useState(false);
  const national = useFireSummary(1);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([near.refetch(), national.refetch()]);
    setRefreshing(false);
  }, [near, national]);

  const loading = near.isLoading || national.isLoading;
  const worst = national.regions[0];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => goBack()} style={styles.back} hitSlop={8} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Crop burning</Text>
          <Text style={styles.subtitle}>Seen from orbit, about 3 hours behind</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.centre}><Loader size={48} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
          }
        >
          {/* ── Across India ───────────────────────────────────────────── */}
          <View style={styles.sectionHead}>
            <Text style={styles.section}>Across India</Text>
            <Text style={styles.sectionWindow}>last 24 hours</Text>
          </View>

          {national.totalFires === 0 && national.unavailable.length > 0 ? (
            // Nothing came back and there is no earlier picture to fall back
            // on. Said plainly and quietly: an alarming panel here reads as a
            // broken app, and claiming the country is clear would be a lie.
            <View style={styles.card}>
              <Text style={styles.cardBody}>
                Updating the national picture. Pull down to refresh — what is around your field,
                below, is already up to date.
              </Text>
            </View>
          ) : national.totalFires === 0 ? (
            <EmptyState
              icon="satellite-alt"
              title="Nothing detected today"
              description="No crop fires reported anywhere the satellites looked in the last 24 hours."
            />
          ) : (
            <>
              <View style={[styles.card, styles.cardTotal]}>
                <Text style={styles.totalNumber}>{national.totalFires}</Text>
                <Text style={styles.totalLabel}>
                  fires detected in the last day{worst ? `, most of them in ${worst.region}` : ''}
                </Text>
              </View>

              {national.regions
                .filter((r) => r.fires > 0)
                .map((r) => {
                  const share = worst?.fires ? r.fires / worst.fires : 0;
                  return (
                    <View key={r.region} style={styles.regionRow}>
                      <View style={styles.regionText}>
                        <Text style={styles.regionName}>{r.region}</Text>
                        <Text style={styles.regionMeta}>{intensity(r.peakBrightnessK)} at its worst</Text>
                      </View>
                      <View style={styles.regionBarWrap}>
                        <View style={[styles.regionBar, { width: `${Math.max(4, share * 100)}%` }]} />
                      </View>
                      <Text style={styles.regionCount}>{r.fires}</Text>
                    </View>
                  );
                })}

              {national.stale ? (
                <Text style={styles.unavailable}>
                  Last updated {sinceText(national.fetchedAt)}. The satellite service did not
                  answer just now, so this is the most recent complete picture — pull down to try
                  again.
                </Text>
              ) : null}

              {!national.stale && national.unavailable.length > 0 ? (
                <Text style={styles.unavailable}>
                  Could not reach the satellite service for {national.unavailable.join(', ')} — those
                  are not counted above rather than being zero.
                </Text>
              ) : null}
            </>
          )}

          {/* ── Near this farm ─────────────────────────────────────────── */}
          <View style={styles.sectionHead}>
            <Text style={styles.section}>Around your field</Text>
            <Text style={styles.sectionWindow}>last 6 months</Text>
          </View>

          {!near.report?.mapped ? (
            <View style={styles.card}>
              <Text style={styles.cardBody}>
                Map a field and this will show what is burning around it.
              </Text>
            </View>
          ) : near.fires.length === 0 && !near.live ? (
            // Empty because nothing answered, not because nothing is burning.
            // The green all-clear below would be a lie here.
            <View style={styles.card}>
              <Text style={styles.cardBody}>
                Checking for fires around your field. Nothing has been recorded here yet — pull
                down to try again.
              </Text>
            </View>
          ) : near.fires.length === 0 ? (
            <View style={[styles.card, styles.cardCalm]}>
              <View style={styles.calmHead}>
                <MaterialIcons name="check-circle" size={22} color={Colors.onSecondaryContainer} />
                <Text style={styles.calmTitle}>Nothing burning nearby</Text>
              </View>
              <Text style={styles.calmBody}>
                No fires within {near.report.radiusKm} km in {windowText(near.report.days)}.
                {near.report.region ? ` You are in ${near.report.region}.` : ''}
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.card, near.upwindCount > 0 ? styles.cardAlarm : styles.cardWatch]}>
                <Text style={[styles.cardTitle, near.upwindCount > 0 && styles.alarmInk]}>
                  {near.upwindCount > 0
                    ? `${near.upwindCount} of ${near.activeCount} recent fires are upwind`
                    : near.activeCount > 0
                      ? `${near.activeCount} burning in the last two days, none upwind`
                      : 'Nothing burning in the last two days'}
                </Text>
                <Text style={[styles.cardBody, near.upwindCount > 0 && styles.alarmInk]}>
                  {near.activeCount === 0
                    ? `${near.fires.length} on record over the last six months, listed below newest first.`
                    : near.report.windFromDeg === null
                      ? 'The wind direction is unknown right now, so every fire is listed.'
                      : `Wind is coming from the ${compass(near.report.windFromDeg)}. Only fires in that direction send their smoke to you.`}
                </Text>
              </View>
              {/* Ten to read, forty more on request — every one a real
                  detection, newest first. */}
              {near.fires.slice(0, showAll ? 50 : 10).map((f, i) => (
                <FireRow key={`${f.latitude}-${f.longitude}-${i}`} fire={f} />
              ))}

              {!showAll && near.fires.length > 10 ? (
                <Pressable
                  onPress={() => setShowAll(true)}
                  style={styles.moreBtn}
                  accessibilityRole="button"
                >
                  <Text style={styles.moreBtnText}>
                    Show {Math.min(40, near.fires.length - 10)} more
                  </Text>
                  <MaterialIcons name="expand-more" size={18} color={Colors.onSecondaryContainer} />
                </Pressable>
              ) : null}

              {showAll && near.fires.length > 50 ? (
                <Text style={styles.more}>
                  and {near.fires.length - 50} older still, within {near.report.radiusKm} km
                </Text>
              ) : null}

              {!near.live ? (
                <Text style={styles.unavailable}>
                  Last updated {sinceText(near.lastUpdated)}.
                </Text>
              ) : null}
            </>
          )}

          <Text style={styles.footnote}>
            NASA FIRMS, VIIRS at 375 m. Regions are approximate — a detection near a border may be
            attributed to its neighbour. A detection is a hot spot, which is almost always a crop
            fire at this time of year but can be a kiln or a flare.
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
  sectionHead: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    marginTop: Spacing.lg,
  },
  section: { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
  // The two sections cover different windows. Unlabelled, forty fires nearby
  // beside "nothing across India" reads as a contradiction rather than as two
  // questions with different answers.
  sectionWindow: { ...Type.labelSmall, color: Colors.onSurfaceVariant },

  card: {
    borderRadius: Shape.extraLarge, padding: Spacing.lg, gap: Spacing.xs,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1, borderColor: Colors.outlineVariant,
    ...Elevation.level1,
  },
  cardCalm: { backgroundColor: Colors.secondaryContainer, borderColor: 'transparent' },
  cardWatch: { backgroundColor: Colors.tertiaryContainer, borderColor: 'transparent' },
  cardAlarm: { backgroundColor: Colors.errorContainer, borderColor: 'transparent' },
  cardTotal: { backgroundColor: Colors.surfaceContainerHigh, borderColor: 'transparent', alignItems: 'center', gap: 0 },
  cardTitle: { ...TypeEmphasized.titleMedium, color: Colors.onTertiaryContainer },
  cardBody: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  alarmInk: { color: Colors.onErrorContainer },
  calmHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  calmTitle: { ...TypeEmphasized.titleMedium, color: Colors.onSecondaryContainer },
  calmBody: { ...Type.bodyMedium, color: Colors.onSecondaryContainer },

  totalNumber: { ...TypeEmphasized.displaySmall, color: Colors.onSurface },
  totalLabel: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center' },

  fireRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: Shape.large,
    backgroundColor: Colors.surfaceContainerLow,
  },
  fireRowUpwind: { backgroundColor: Colors.errorContainer },
  fireDist: { width: 48, alignItems: 'center' },
  fireKm: { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
  fireKmUnit: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  fireText: { flex: 1, gap: 2 },
  fireHead: { ...Type.titleSmall, color: Colors.onSurface },
  fireSub: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  upwindTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.sm, height: 26, borderRadius: Shape.full,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  upwindTagText: { ...Type.labelSmall, color: Colors.onErrorContainer },
  moreBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.xs,
    paddingVertical: Spacing.md, marginTop: Spacing.xs,
    borderRadius: Shape.full, backgroundColor: Colors.secondaryContainer,
  },
  moreBtnText: { ...TypeEmphasized.labelLarge, color: Colors.onSecondaryContainer },
  more: { ...Type.bodySmall, color: Colors.onSurfaceVariant, textAlign: 'center', paddingVertical: Spacing.sm },

  regionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm },
  regionText: { width: 120 },
  regionName: { ...Type.titleSmall, color: Colors.onSurface },
  regionMeta: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  regionBarWrap: { flex: 1, height: 8, borderRadius: Shape.full, backgroundColor: Colors.surfaceContainerHigh, overflow: 'hidden' },
  regionBar: { height: '100%', borderRadius: Shape.full, backgroundColor: Colors.tertiaryContainer },
  regionCount: { ...TypeEmphasized.titleSmall, color: Colors.onSurface, width: 36, textAlign: 'right' },

  unavailable: { ...Type.bodySmall, color: Colors.onSurfaceVariant, fontStyle: 'italic', marginTop: Spacing.sm },
  footnote: { ...Type.bodySmall, color: Colors.outline, marginTop: Spacing.xl, lineHeight: 18 },
});
