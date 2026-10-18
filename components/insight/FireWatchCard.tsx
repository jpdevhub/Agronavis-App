import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { Loader } from '@/components/ui';
import { useFarmFires } from '@/hooks/useFires';
import { useFarmStore } from '@/store/useFarmStore';
import { fireWatchState } from '@/features/insight/cardState';

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
  const { report, fires, upwindCount, activeCount, nearestKm, isLoading, live } = useFarmFires();
  // A mapped field, not a farm: smoke blowing over a sign-up pin is not a
  // warning about anyone's crop.
  const hasField = Boolean(useFarmStore((s) => s.activeFieldId));

  // The decision lives in `cardState` so every branch below is assertable
  // without rendering. See features/insight/__tests__/cardState.test.ts.
  const state = fireWatchState({
    hasField,
    isLoading,
    mapped: report?.mapped,
    live,
    fires,
    upwindCount,
    activeCount,
  });

  // Deliberately not `return null`. A card that disappears when its data is
  // missing is indistinguishable from a card that was never built — which is
  // exactly how this one read on a farm whose field had not been selected yet.
  if (state.kind === 'loading') {
    return (
      <View style={[styles.card, styles.cardQuiet]}>
        <View style={styles.head}>
          <View style={[styles.badge, { backgroundColor: Colors.surfaceContainerHigh }]}>
            <Loader size={28} />
          </View>
          <View style={styles.headText}>
            <Text style={[styles.eyebrow, { color: Colors.onSurfaceVariant }]}>STUBBLE WATCH</Text>
            <Text style={[styles.headline, { color: Colors.onSurface }]}>Checking the sky</Text>
          </View>
        </View>
      </View>
    );
  }

  if (state.kind === 'no-field') {
    return (
      <View style={[styles.card, styles.cardQuiet]}>
        <View style={styles.head}>
          <View style={[styles.badge, { backgroundColor: Colors.surfaceContainerHigh }]}>
            <MaterialIcons name="local-fire-department" size={22} color={Colors.onSurfaceVariant} />
          </View>
          <View style={styles.headText}>
            <Text style={[styles.eyebrow, { color: Colors.onSurfaceVariant }]}>STUBBLE WATCH</Text>
            <Text style={[styles.headline, { color: Colors.onSurface }]}>Add your first plot</Text>
          </View>
        </View>
        <Text style={[styles.detail, { color: Colors.onSurfaceVariant }]}>
          Draw where your crop grows and this watches for stubble fires upwind of it, so you know
          before the smoke arrives.
        </Text>
      </View>
    );
  }

  // Nothing came back and nothing answered. The green all-clear below would
  // be a lie, so this says what is actually true.
  if (state.kind === 'unavailable') {
    return (
      <View style={[styles.card, styles.cardQuiet]}>
        <View style={styles.head}>
          <View style={[styles.badge, { backgroundColor: Colors.surfaceContainerHigh }]}>
            <MaterialIcons name="local-fire-department" size={22} color={Colors.onSurfaceVariant} />
          </View>
          <View style={styles.headText}>
            <Text style={[styles.eyebrow, { color: Colors.onSurfaceVariant }]}>STUBBLE WATCH</Text>
            <Text style={[styles.headline, { color: Colors.onSurface }]}>Checking for fires</Text>
          </View>
        </View>
        <Text style={[styles.detail, { color: Colors.onSurfaceVariant }]}>
          Nothing recorded around your field yet. This is not an all-clear — open it to try again.
        </Text>
      </View>
    );
  }

  const upwind = state.tone === 'upwind';
  const anyNear = state.fireCount > 0;
  const nearestActiveKm = Math.round(state.nearestKm ?? 0);

  const tone = upwind
    ? { ground: Colors.errorContainer, ink: Colors.onErrorContainer, icon: 'local-fire-department' as const }
    : anyNear
      ? { ground: Colors.tertiaryContainer, ink: Colors.onTertiaryContainer, icon: 'visibility' as const }
      : { ground: Colors.secondaryContainer, ink: Colors.onSecondaryContainer, icon: 'check-circle' as const };

  const headline = upwind
    ? `${upwindCount} fire${upwindCount === 1 ? '' : 's'} upwind of you`
    : anyNear
      ? `${state.fireCount} fire${state.fireCount === 1 ? '' : 's'} nearby, none upwind`
      : 'No fires near your field';

  const detail = upwind
    ? `Nearest about ${nearestActiveKm} km away. Expect smoke — keep children indoors early morning and hold off spraying.`
    : anyNear
      ? `The nearest is about ${nearestActiveKm} km away, but the wind is carrying its smoke elsewhere.`
      : `Nothing burning within ${report?.radiusKm ?? 150} km in the last two days${
          state.historyCount > 0 ? `. ${state.historyCount} on record over six months` : ''
        }.`;

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

      <Text style={[styles.detail, { color: tone.ink }]}>
        {detail}
        {state.stale ? ' Shown from the last successful check.' : ''}
      </Text>

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
  cardQuiet: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
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
