import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { SolarDay } from '@agronavis/shared-types';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { useWeather } from '@/hooks/useWeather';
import { useFarmStore } from '@/store/useFarmStore';
import { Loader } from '@/components/ui';

/** Deficit thresholds the irrigation advisory uses, in mm over three days. */
const DEFICIT = { severe: 18, high: 10, mild: 4 };

/**
 * An API older than this screen sends no humidity, wind or substitution list —
 * the fields were computed server-side and discarded before being exposed. A
 * deployed backend is always allowed to be behind the app, so every day is
 * squared up here rather than trusted to match the type.
 */
function normalise(day: SolarDay): SolarDay {
  return {
    ...day,
    humidity: typeof day.humidity === 'number' ? day.humidity : 0,
    windSpeed2m: typeof day.windSpeed2m === 'number' ? day.windSpeed2m : 0,
    substituted: Array.isArray(day.substituted) ? day.substituted : [],
  };
}

function dayLabel(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

function Row({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowRight}>
        <Text style={styles.rowValue}>{value}</Text>
        {note ? <Text style={styles.rowNote}>{note}</Text> : null}
      </View>
    </View>
  );
}

/** One day of POWER measurements, with the derived ET₀ set apart from them. */
function DayCard({ day }: { day: SolarDay }) {
  const balance = Math.round((day.et0 - day.precipitation) * 100) / 100;

  return (
    <View style={styles.dayCard}>
      <View style={styles.dayHead}>
        <Text style={styles.dayDate}>{dayLabel(day.date)}</Text>
        <View style={[styles.balancePill, balance > 0 ? styles.balanceLoss : styles.balanceGain]}>
          <Text style={[styles.balanceText, balance > 0 ? styles.balanceLossText : styles.balanceGainText]}>
            {balance > 0 ? `−${balance.toFixed(1)} mm` : `+${Math.abs(balance).toFixed(1)} mm`}
          </Text>
        </View>
      </View>

      <View style={styles.grid}>
        <Metric label="Solar" value={`${day.solarRadiation}`} unit="MJ/m²" />
        <Metric label="Max temp" value={`${day.temperatureMax}`} unit="°C" />
        <Metric label="Min temp" value={`${day.temperatureMin}`} unit="°C" />
        <Metric
          label="Humidity"
          value={day.humidity ? `${day.humidity}` : '—'}
          unit={day.humidity ? '%' : ''}
          assumed={day.substituted.includes('humidity')}
        />
        <Metric
          label="Wind at 2 m"
          value={day.windSpeed2m ? `${day.windSpeed2m}` : '—'}
          unit={day.windSpeed2m ? 'm/s' : ''}
          assumed={day.substituted.includes('wind')}
        />
        <Metric
          label="Rainfall"
          value={`${day.precipitation}`}
          unit="mm"
          assumed={day.substituted.includes('precipitation')}
        />
      </View>

      <View style={styles.derived}>
        <Text style={styles.derivedLabel}>ET₀ (derived)</Text>
        <Text style={styles.derivedValue}>{day.et0.toFixed(2)} mm</Text>
      </View>
    </View>
  );
}

function Metric({
  label,
  value,
  unit,
  assumed,
}: {
  label: string;
  value: string;
  unit: string;
  assumed?: boolean;
}) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>
        {value}
        <Text style={styles.metricUnit}> {unit}</Text>
      </Text>
      {assumed ? <Text style={styles.metricAssumed}>assumed</Text> : null}
    </View>
  );
}

export default function WeatherReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ fieldId?: string; farmId?: string }>();

  const storeFieldId = useFarmStore((s) => s.activeFieldId);
  const storeFarmId = useFarmStore((s) => s.activeFarmId);
  const fieldId = params.fieldId ?? storeFieldId;
  const farmId = params.farmId ?? storeFarmId;

  const { data, current, isLoading, isStale } = useWeather(farmId, fieldId);

  const solar = useMemo(
    () => [...(data?.solar ?? [])].map(normalise).reverse(),
    [data?.solar],
  );
  const deficit = data?.waterDeficitMm ?? null;

  const verdict = useMemo(() => {
    if (deficit === null) return null;
    if (deficit > DEFICIT.severe) return { text: 'Irrigate today', tone: styles.verdictSevere };
    if (deficit > DEFICIT.high) return { text: 'Irrigate within 48 hours', tone: styles.verdictHigh };
    if (deficit > DEFICIT.mild) return { text: 'Check soil moisture', tone: styles.verdictMild };
    return { text: 'Water balance satisfied', tone: styles.verdictOk };
  }, [deficit]);

  const assumedDays = solar.filter((d) => d.substituted.length > 0).length;

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Weather record</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            NASA POWER · FAO-56 Penman-Monteith
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centre}>
          <Loader size={28} />
        </View>
      ) : (
        <ScrollView
          style={styles.fill}
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + Spacing.xxl }]}
        >
          {current && (
            <>
              <Text style={styles.section}>Right now</Text>
              <View style={styles.card}>
                <Row label="Temperature" value={`${Math.round(current.temp)} °C`} note={`feels ${Math.round(current.feelsLike)} °C`} />
                <Row label="Conditions" value={current.description} />
                <Row label="Humidity" value={`${current.humidity} %`} />
                <Row label="Wind" value={`${current.windSpeed} km/h`} />
                <Text style={styles.sourceLine}>
                  OpenWeatherMap, live{isStale ? ' — showing the last stored reading' : ''}
                </Text>
              </View>
            </>
          )}

          <Text style={styles.section}>Water balance</Text>
          <View style={styles.card}>
            {deficit === null ? (
              <Text style={styles.rowNote}>
                Not enough POWER data for this location yet.
              </Text>
            ) : (
              <>
                <View style={styles.headline}>
                  <Text style={styles.headlineValue}>
                    {deficit > 0 ? `−${deficit}` : `+${Math.abs(deficit)}`}
                    <Text style={styles.headlineUnit}> mm</Text>
                  </Text>
                  <Text style={styles.headlineCaption}>
                    evapotranspiration minus rainfall, last three days
                  </Text>
                </View>
                {verdict && (
                  <View style={[styles.verdict, verdict.tone]}>
                    <Text style={styles.verdictText}>{verdict.text}</Text>
                  </View>
                )}
                {deficit > 0 && (
                  <Text style={styles.sourceLine}>
                    Replacing it takes about {Math.round(deficit)} mm, or{' '}
                    {Math.round(deficit * 4.05)} m³ per acre.
                  </Text>
                )}
              </>
            )}
          </View>

          <Text style={styles.section}>Daily measurements</Text>
          {solar.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.rowNote}>
                NASA POWER has published nothing for this point yet. It lags real time by three to
                four days.
              </Text>
            </View>
          ) : (
            solar.map((day) => <DayCard key={day.date} day={day} />)
          )}

          <Text style={styles.section}>How this is produced</Text>
          <View style={styles.card}>
            <Text style={styles.method}>
              The six measurements above come from NASA POWER, satellite-derived and reanalysed for
              the exact coordinates of your field. POWER publishes no evapotranspiration of its own:
              ET₀ is computed from them here by FAO-56 Penman-Monteith, the method the Food and
              Agriculture Organization defines for reference crop water use.
            </Text>
            <Text style={styles.method}>
              POWER lags real time by three to four days, so the most recent rows are the newest that
              exist, not today. Current conditions above come from OpenWeatherMap instead, which is
              live but carries no radiation measurement and so cannot drive a water balance.
            </Text>
            {assumedDays > 0 && (
              <Text style={styles.methodWarn}>
                {assumedDays} {assumedDays === 1 ? 'day is' : 'days are'} marked “assumed”. POWER had
                no humidity or wind for those, so FAO-56&apos;s standard substitutes were used — 60%
                and 2 m/s. Their ET₀ is a weaker figure than the rest.
              </Text>
            )}
          </View>
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

  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: Spacing.lg, gap: Spacing.md },

  section: { ...TypeEmphasized.titleMedium, color: Colors.onSurface, marginTop: Spacing.sm },
  card: {
    gap: Spacing.sm, padding: Spacing.md,
    borderRadius: Shape.large, backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },

  row: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  rowLabel: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  rowRight: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.xs },
  rowValue: { ...Type.bodyLarge, color: Colors.onSurface },
  rowNote: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  sourceLine: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: Spacing.xs },

  headline: { gap: 2 },
  headlineValue: { ...TypeEmphasized.displaySmall, color: Colors.onSurface },
  headlineUnit: { ...Type.titleMedium, color: Colors.onSurfaceVariant },
  headlineCaption: { ...Type.bodySmall, color: Colors.onSurfaceVariant },

  verdict: {
    alignSelf: 'flex-start', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Shape.full, marginTop: Spacing.xs,
  },
  verdictText: { ...TypeEmphasized.labelLarge, color: Colors.onSurface },
  verdictSevere: { backgroundColor: Colors.errorContainer },
  verdictHigh: { backgroundColor: Colors.tertiaryFixed },
  verdictMild: { backgroundColor: Colors.secondaryContainer },
  verdictOk: { backgroundColor: Colors.primaryFixed },

  dayCard: {
    gap: Spacing.sm, padding: Spacing.md,
    borderRadius: Shape.large, backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  dayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayDate: { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
  balancePill: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Shape.full },
  balanceLoss: { backgroundColor: Colors.errorContainer },
  balanceGain: { backgroundColor: Colors.primaryFixed },
  balanceText: { ...Type.labelLarge },
  balanceLossText: { color: Colors.error },
  balanceGainText: { color: Colors.onPrimaryContainer },

  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.sm },
  metric: { width: '33.33%', gap: 1 },
  metricLabel: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  metricValue: { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
  metricUnit: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  metricAssumed: { ...Type.bodySmall, color: Colors.tertiary },

  derived: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between',
    paddingTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
  },
  derivedLabel: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  derivedValue: { ...TypeEmphasized.titleMedium, color: Colors.primary },

  method: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  methodWarn: { ...Type.bodySmall, color: Colors.tertiary },
});
