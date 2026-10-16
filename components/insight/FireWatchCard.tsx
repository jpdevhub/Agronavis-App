import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { useFarmFires } from '@/hooks/useFires';

/**
 * Whether stubble smoke is heading for this field.
 *
 * The card has to be legible in the case that is true most of the year —
 * nothing burning — without looking broken or empty. So the calm state is a
 * statement rather than a blank: it says the sky is clear and how far it
 * looked to be sure.
 */
export function FireWatchCard() {
  const router = useRouter();
  const { report, fires, upwindCount, nearestKm, isLoading } = useFarmFires();

  if (isLoading || !report?.mapped) return null;

  const upwind = upwindCount > 0;
  const anyNear = fires.length > 0;

  const tone = upwind
    ? { ground: Colors.errorContainer, ink: Colors.onErrorContainer, icon: 'local-fire-department' as const }
    : anyNear
      ? { ground: Colors.tertiaryContainer, ink: Colors.onTertiaryContainer, icon: 'visibility' as const }
      : { ground: Colors.secondaryContainer, ink: Colors.onSecondaryContainer, icon: 'check-circle' as const };

  const headline = upwind
    ? `${upwindCount} fire${upwindCount === 1 ? '' : 's'} upwind of you`
    : anyNear
      ? `${fires.length} fire${fires.length === 1 ? '' : 's'} nearby, none upwind`
      : 'No fires near your field';

  const detail = upwind
    ? `Nearest about ${Math.round(nearestKm ?? 0)} km away. Expect smoke — keep children indoors early morning and hold off spraying.`
    : anyNear
      ? `The nearest is about ${Math.round(nearestKm ?? 0)} km away, but the wind is carrying its smoke elsewhere.`
      : `Nothing burning within ${report.radiusKm} km in the last ${report.days} days.`;

  return (
    <Pressable
      onPress={() => router.push('/fires' as never)}
      accessibilityRole="button"
      accessibilityLabel={`${headline}. Open the fire map.`}
      style={({ pressed }) => [styles.card, { backgroundColor: tone.ground }, pressed && styles.pressed]}
    >
      <View style={styles.head}>
        <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.45)' }]}>
          <MaterialIcons name={tone.icon} size={22} color={tone.ink} />
        </View>
        <View style={styles.headText}>
          <Text style={[styles.eyebrow, { color: tone.ink }]}>STUBBLE WATCH</Text>
          <Text style={[styles.headline, { color: tone.ink }]}>{headline}</Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={tone.ink} />
      </View>

      <Text style={[styles.detail, { color: tone.ink }]}>{detail}</Text>

      <Text style={[styles.source, { color: tone.ink }]}>
        NASA FIRMS · satellite, about 3 hours behind
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Shape.extraLarge,
    padding: Spacing.lg,
    gap: Spacing.sm,
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
  eyebrow: { ...Type.labelSmall, letterSpacing: 1.2, opacity: 0.75 },
  headline: { ...TypeEmphasized.titleMedium },
  detail: { ...Type.bodyMedium, opacity: 0.9 },
  source: { ...Type.bodySmall, opacity: 0.6, marginTop: 2 },
});
