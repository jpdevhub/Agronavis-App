import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { EligibleCrop } from '@agronavis/shared-types';
import { Colors, Elevation, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { cropApi } from '@/services/endpoints';
import { useFarmStore } from '@/store/useFarmStore';
import { showAlert } from '@/utils/alert';
import { Loader } from '@/components/ui';

/**
 * Most field crops in the recommendation list run a season of roughly four
 * months. The scheme does not publish a duration, so the timeline uses this
 * until a crop-specific figure is available.
 */
const DEFAULT_SEASON_DAYS = 120;

/** Splits "Rice (Medium Duration / Rainfed / Kharif)" into its parts. */
function describe(crop: EligibleCrop): string[] {
  const inside = /\(([^)]*)\)/.exec(crop.label)?.[1];
  if (!inside) return [];
  return inside
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0 && part.toLowerCase() !== 'all variety' && part.toLowerCase() !== 'all');
}

export default function ChooseCropScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const activeFieldId = useFarmStore((s) => s.activeFieldId);

  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState<EligibleCrop | null>(null);

  const query = useQuery({
    queryKey: ['crops', 'eligible', activeFieldId],
    queryFn: () => cropApi.eligible(activeFieldId as string),
    enabled: Boolean(activeFieldId),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const crops = query.data ?? [];

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return crops;
    return crops.filter((c) => c.label.toLowerCase().includes(term));
  }, [crops, search]);

  const save = useMutation({
    mutationFn: (crop: EligibleCrop) =>
      cropApi.create({
        name: crop.name,
        variety: crop.variety ?? undefined,
        fieldId: activeFieldId ?? undefined,
        shcCropId: crop.shcId,
        durationDays: DEFAULT_SEASON_DAYS,
      } as never),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      router.back();
    },
    onError: (e: Error) => showAlert('Could not add the crop', e.message),
  });

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} accessibilityLabel="Back">
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Add a crop</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {query.isLoading ? 'Loading…' : `${crops.length} crops advised for your area`}
          </Text>
        </View>
      </View>

      {!activeFieldId ? (
        <Empty
          icon="crop-square"
          title="Map a field first"
          body="Draw a boundary so the crops offered here match where your land is."
        />
      ) : query.isLoading ? (
        <View style={styles.centre}>
          <Loader size={28} />
        </View>
      ) : crops.length === 0 ? (
        <Empty
          icon="eco"
          title="No crops listed yet"
          body="The Soil Health Card scheme has not published recommendations for your state. You can still record irrigation and pest advice."
        />
      ) : (
        <>
          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={20} color={Colors.onSurfaceVariant} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search crops"
              placeholderTextColor={Colors.onSurfaceVariant}
              style={styles.searchInput}
              autoCorrect={false}
            />
          </View>

          <ScrollView
            style={styles.list}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 96 }]}
            keyboardShouldPersistTaps="handled"
          >
            {filtered.map((crop) => {
              const selected = chosen?.shcId === crop.shcId;
              const tags = describe(crop);
              return (
                <Pressable
                  key={crop.shcId}
                  onPress={() => setChosen(selected ? null : crop)}
                  style={({ pressed }) => [
                    styles.card,
                    selected && styles.cardSelected,
                    pressed && styles.cardPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                >
                  {/* Leading avatar: the crop's initial, so a long list has
                      something to scan down other than left-aligned text. */}
                  <View style={[styles.avatar, selected && styles.avatarSelected]}>
                    {selected ? (
                      <MaterialIcons name="check" size={22} color={Colors.onPrimary} />
                    ) : (
                      <Text style={styles.avatarText}>{crop.name.charAt(0).toUpperCase()}</Text>
                    )}
                  </View>

                  <View style={styles.cardText}>
                    <Text
                      style={[styles.cardName, selected && styles.cardNameSelected]}
                      numberOfLines={2}
                    >
                      {crop.name}
                    </Text>
                    {tags.length > 0 && (
                      <View style={styles.tags}>
                        {tags.map((tag) => (
                          <View key={tag} style={[styles.tag, selected && styles.tagSelected]}>
                            <Text style={[styles.tagText, selected && styles.tagTextSelected]}>
                              {tag}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
            {filtered.length === 0 && <Text style={styles.noMatch}>Nothing matches that search.</Text>}
          </ScrollView>

          {chosen && (
            <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
              <Pressable
                onPress={() => save.mutate(chosen)}
                disabled={save.isPending}
                style={[styles.cta, save.isPending && styles.ctaBusy]}
                accessibilityRole="button"
              >
                <Text style={styles.ctaText}>
                  {save.isPending ? 'Adding…' : `Add ${chosen.name} and build its plan`}
                </Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );
}

function Empty({
  icon,
  title,
  body,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  body: string;
}) {
  return (
    <View style={styles.centre}>
      <MaterialIcons name={icon} size={40} color={Colors.onSurfaceVariant} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
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
  emptyTitle: { ...TypeEmphasized.titleLarge, color: Colors.onSurface, textAlign: 'center' },
  emptyBody: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg, height: 52,
    borderRadius: Shape.full, backgroundColor: Colors.surfaceContainerHigh,
  },
  searchInput: { flex: 1, ...Type.bodyLarge, color: Colors.onSurface },

  list: { flex: 1 },
  listContent: { padding: Spacing.lg, gap: Spacing.md },

  // An outlined card that fills when chosen, which is the M3 pattern for a
  // selection in a list — not a tinted row with a tick hanging off the end.
  card: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Shape.largeIncreased,
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  cardSelected: {
    backgroundColor: Colors.secondaryContainer,
    borderColor: 'transparent',
    ...Elevation.level1,
  },
  cardPressed: { opacity: 0.85 },

  avatar: {
    width: 44, height: 44, borderRadius: Shape.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  avatarSelected: { backgroundColor: Colors.primary },
  avatarText: { ...TypeEmphasized.titleMedium, color: Colors.onSurfaceVariant },

  cardText: { flex: 1, gap: Spacing.xs },
  cardName: { ...TypeEmphasized.titleSmall, color: Colors.onSurface },
  cardNameSelected: { color: Colors.onSecondaryContainer },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tag: {
    paddingHorizontal: Spacing.sm, height: 24, justifyContent: 'center',
    borderRadius: Shape.small, backgroundColor: Colors.surfaceContainerHigh,
  },
  tagSelected: { backgroundColor: 'rgba(255,255,255,0.5)' },
  tagText: { ...Type.labelSmall, color: Colors.onSurfaceVariant },
  tagTextSelected: { color: Colors.onSecondaryContainer },
  noMatch: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, padding: Spacing.lg, textAlign: 'center' },

  footer: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  cta: {
    height: 60, borderRadius: Shape.full, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Elevation.level2,
  },
  ctaBusy: { backgroundColor: Colors.outlineVariant },
  ctaText: { ...TypeEmphasized.titleMedium, color: Colors.onPrimary },
});
