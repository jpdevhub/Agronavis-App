import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { useWeather } from '@/hooks/useWeather';
import { useFarmStore } from '@/store/useFarmStore';

/**
 * How much water is actually in the root zone, beside what the balance says.
 *
 * The irrigation advice is a calculation of water in and water out. This is
 * NASA measuring what is down there. Showing them together is the point — the
 * farmer can see when the two agree, and the app has already said so when they
 * do not.
 */
function band(v: number): { label: string; ground: string; ink: string } {
  if (v >= 0.6) return { label: 'Wet', ground: Colors.secondaryContainer, ink: Colors.onSecondaryContainer };
  if (v >= 0.35) return { label: 'Adequate', ground: Colors.secondaryContainer, ink: Colors.onSecondaryContainer };
  if (v >= 0.2) return { label: 'Drying', ground: Colors.tertiaryContainer, ink: Colors.onTertiaryContainer };
  return { label: 'Dry', ground: Colors.errorContainer, ink: Colors.onErrorContainer };
}

export function RootZoneCard() {
  const router = useRouter();
  const farmId = useFarmStore((s) => s.activeFarmId);
  const fieldId = useFarmStore((s) => s.activeFieldId);
  const { data: bundle, waterDeficitMm, isLoading } = useWeather(farmId, fieldId);

  // Most recent day POWER published a reading. It runs two to three days
  // behind, so the date is shown rather than implied to be today.
  const latest = [...(bundle?.solar ?? [])]
    .reverse()
    .find((d) => typeof d.soilWetnessRoot === 'number');

  if (isLoading || !latest || latest.soilWetnessRoot === null) return null;

  const pct = Math.round(latest.soilWetnessRoot * 100);
  const tone = band(latest.soilWetnessRoot);
  const deficit = waterDeficitMm ?? null;

  return (
    <Pressable
      onPress={() => router.push('/weather-report' as never)}
      accessibilityRole="button"
      accessibilityLabel={`Root zone water ${pct} percent of saturation. Open the weather record.`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.head}>
        <View style={[styles.badge, { backgroundColor: tone.ground }]}>
          <MaterialIcons name="water-drop" size={22} color={tone.ink} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.eyebrow}>ROOT ZONE WATER</Text>
          <Text style={styles.headline}>
            {pct}% <Text style={styles.headlineSoft}>of saturation</Text>
          </Text>
        </View>
        <View style={[styles.pill, { backgroundColor: tone.ground }]}>
          <Text style={[styles.pillText, { color: tone.ink }]}>{tone.label}</Text>
        </View>
      </View>

      {/* The measurement as a bar, so a number becomes a position. */}
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.min(100, pct)}%`, backgroundColor: tone.ink }]} />
      </View>

      <Text style={styles.detail}>
        {deficit !== null && deficit > 4
          ? `The water balance shows a ${deficit} mm shortfall. ${
              latest.soilWetnessRoot >= 0.5
                ? 'The measurement disagrees — dig before you irrigate.'
                : 'The measurement agrees.'
            }`
          : 'Measured by satellite, not worked out from rainfall.'}
      </Text>

      <Text style={styles.source}>NASA POWER · measured {latest.date}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Shape.extraLarge,
    padding: Spacing.lg,
    gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    ...Elevation.level1,
  },
  pressed: { opacity: 0.9 },
  head: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  badge: {
    width: 44,
    height: 44,
    borderRadius: Shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headText: { flex: 1, gap: 2 },
  eyebrow: { ...Type.labelSmall, color: Colors.onSurfaceVariant, letterSpacing: 1.2 },
  headline: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  headlineSoft: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  pill: { paddingHorizontal: Spacing.md, height: 28, borderRadius: Shape.full, justifyContent: 'center' },
  pillText: { ...Type.labelLarge },

  track: {
    height: 10,
    borderRadius: Shape.full,
    backgroundColor: Colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: Shape.full },

  detail: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  source: { ...Type.bodySmall, color: Colors.outline },
});
