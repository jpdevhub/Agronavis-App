import { useMemo, useState } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useGoBack } from '@/hooks/useGoBack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { CropSuggestion, EligibleCrop } from '@agronavis/shared-types';
import { Colors, Elevation, Radii, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { cropApi } from '@/services/endpoints';
import { useFarmStore } from '@/store/useFarmStore';
import { useFarmFields } from '@/hooks/useFarmFields';
import { useFieldRecommendations, useStateRecommendations } from '@/hooks/useCropRecommendations';
import { showAlert } from '@/utils/alert';
import { NavScrim } from '@/components/ui';
import {
  BestPick, CropRow, CropSheet, IndiaMap, SortChips, UnratedRow,
  mergeRanking, orderMerged, rankedCount, sortSuggestions,
  type MapState, type RankedCrop, type SortKey,
} from '@/features/recommend';

/**
 * Choosing what to plant.
 *
 * The scheme's crop list, ordered by what actually suits this field and what
 * it is worth. Every crop the scheme lists stays on the screen — the ranking
 * changes the order and says what is against each one, and the farmer picks.
 *
 * Two views over the same question. The list uses the field: its soil card,
 * the weather over its own coordinates, its acreage. The map answers for any
 * state, from the season, that state's mandi and the districts' soil, and
 * says so rather than implying it knows the ground.
 */

/**
 * Most field crops run roughly four months. The scheme publishes no duration,
 * so the timeline uses this where the ranking has no better figure.
 */
const DEFAULT_SEASON_DAYS = 120;

/** The range `POST /crops` accepts. A banana's 330 days is real; 0 is not. */
const clampSeason = (days: number) => Math.min(400, Math.max(30, Math.round(days)));

export default function ChooseCropScreen() {
  const goBack = useGoBack('/(tabs)/dashboard');
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const activeFieldId = useFarmStore((s) => s.activeFieldId);
  const { data: fields } = useFarmFields();

  /** Where this field is — not where the farmer registered. They differ. */
  const activeField = useMemo(
    () => fields?.find((f) => f.id === activeFieldId) ?? null,
    [fields, activeFieldId],
  );
  const fieldState = activeField?.state ?? null;

  const [view, setView] = useState<'list' | 'map'>('list');
  const [sort, setSort] = useState<SortKey>('profit');
  const [search, setSearch] = useState('');
  const [chosen, setChosen] = useState<EligibleCrop | null>(null);
  const [detail, setDetail] = useState<CropSuggestion | null>(null);
  const [tappedState, setTappedState] = useState<string | null>(null);
  const shownState = tappedState ?? fieldState;

  const catalogue = useQuery({
    queryKey: ['crops', 'eligible', activeFieldId],
    queryFn: () => cropApi.eligible(activeFieldId as string),
    enabled: Boolean(activeFieldId),
    staleTime: 1000 * 60 * 60 * 24,
  });

  const field = useFieldRecommendations();
  const browse = useStateRecommendations(view === 'map' ? shownState : null);

  const eligible = useMemo(() => catalogue.data ?? [], [catalogue.data]);

  /** The scheme's list with a ranking attached where one exists. */
  const merged = useMemo(
    () => mergeRanking(eligible, field.data?.suggestions ?? []),
    [eligible, field.data],
  );

  const ordered = useMemo(() => orderMerged(merged, sort), [merged, sort]);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return ordered;
    return ordered.filter((c) => c.eligible.label.toLowerCase().includes(term));
  }, [ordered, search]);

  const best = ordered[0]?.ranking ?? null;

  const save = useMutation({
    mutationFn: (crop: RankedCrop) =>
      cropApi.create({
        name: crop.eligible.name,
        variety: crop.eligible.variety ?? undefined,
        fieldId: activeFieldId ?? undefined,
        shcCropId: crop.eligible.shcId,
        // The API takes 30-400; a perennial's profile can sit outside that.
        durationDays: clampSeason(crop.ranking?.durationDays ?? DEFAULT_SEASON_DAYS),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['recommend'] });
      goBack();
    },
    onError: (e: Error) => showAlert('Could not add the crop', e.message),
  });

  const chosenRow = chosen ? merged.find((c) => c.eligible.shcId === chosen.shcId) ?? null : null;
  /** Every state this farmer has land in, so the map shows the whole holding. */
  const myStates: MapState[] = useMemo(() => {
    const names = new Set((fields ?? []).map((f) => f.state).filter((s): s is string => !!s));
    return [...names].map((name) => ({ name, highlighted: true }));
  }, [fields]);

  const subtitle = !activeFieldId
    ? 'Map a field first'
    : catalogue.isLoading
      ? 'Loading…'
      : [
          activeField?.name ?? field.data?.fieldName,
          [activeField?.district, fieldState].filter(Boolean).join(', ') || null,
          activeField ? `${activeField.areaAcres} acres` : null,
          field.data?.month ?? null,
        ].filter(Boolean).join(' · ');

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable onPress={() => goBack()} style={styles.iconBtn} accessibilityLabel="Back">
          <MaterialIcons name="close" size={22} color={Colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Add a crop</Text>
          <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
        </View>
        <View style={styles.toggle}>
          {(['map', 'list'] as const).map((mode) => (
            <Pressable
              key={mode}
              onPress={() => setView(mode)}
              style={[styles.toggleBtn, view === mode && styles.toggleOn]}
              accessibilityRole="radio"
              accessibilityState={{ selected: view === mode }}
            >
              <MaterialIcons
                name={mode === 'map' ? 'map' : 'view-list'}
                size={16}
                color={view === mode ? Colors.onPrimary : Colors.onSurfaceVariant}
              />
              <Text style={[styles.toggleText, view === mode && styles.toggleTextOn]}>
                {mode === 'map' ? 'Map' : 'List'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {!activeFieldId ? (
        <Empty
          icon="crop-square"
          title="Map a field first"
          body="Draw a boundary so the crops offered here match where your land is."
        />
      ) : view === 'map' ? (
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
          <IndiaMap states={myStates} selected={shownState} onSelect={setTappedState} />
          <View style={styles.statePanel}>
            {!shownState ? (
              <Text style={styles.hint}>Tap a state to see what suits it this month.</Text>
            ) : (
              <>
                <Text style={styles.stateName}>{shownState}</Text>
                <Text style={styles.stateBasis}>
                  {browse.data
                    ? `${browse.data.month} · ${browse.data.soilBasis} · no field weather at state level`
                    : shownState === fieldState
                      ? 'Your land is here'
                      : 'Loading…'}
                </Text>
                {browse.isLoading ? (
                  <ActivityIndicator style={styles.loader} color={Colors.primary} />
                ) : browse.isError ? (
                  <Pressable style={styles.statusRow} onPress={() => browse.refetch()}>
                    <MaterialIcons name="cloud-off" size={16} color={Colors.onSurfaceVariant} />
                    <Text style={styles.coverage}>
                      Could not load {shownState}. <Text style={styles.retry}>Retry</Text>
                    </Text>
                  </Pressable>
                ) : (
                  <View style={styles.list}>
                    {sortSuggestions(browse.data?.suggestions ?? [], 'profit')
                      .slice(0, 8)
                      .map((crop) => (
                        <CropRow key={crop.crop} crop={crop} onPress={setDetail} />
                      ))}
                  </View>
                )}
              </>
            )}
          </View>
        </ScrollView>
      ) : catalogue.isLoading ? (
        <ActivityIndicator style={styles.loader} color={Colors.primary} />
      ) : eligible.length === 0 ? (
        <Empty
          icon="eco"
          title="No crops listed yet"
          body="The Soil Health Card scheme has not published recommendations for your state. You can still record irrigation and pest advice."
        />
      ) : (
        <>
          <SortChips active={sort} onChange={setSort} />
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
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 120 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {best && !search ? (
              <BestPick crop={best} areaAcres={field.data?.areaAcres} />
            ) : null}

            {field.isLoading ? (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.coverage}>Ranking these for your soil and weather…</Text>
              </View>
            ) : field.isError ? (
              <Pressable style={styles.statusRow} onPress={() => field.refetch()}>
                <MaterialIcons name="cloud-off" size={16} color={Colors.onSurfaceVariant} />
                <Text style={styles.coverage}>
                  Ranking unavailable — every crop below is still yours to pick.{' '}
                  <Text style={styles.retry}>Retry</Text>
                </Text>
              </Pressable>
            ) : field.data ? (
              <Text style={styles.coverage}>
                {rankedCount(merged)} of {eligible.length} rated for your soil and weather
              </Text>
            ) : null}

            <View style={styles.list}>
              {visible.map((row) =>
                row.ranking ? (
                  <CropRow
                    key={row.eligible.shcId}
                    crop={row.ranking}
                    label={row.eligible.label}
                    selected={chosen?.shcId === row.eligible.shcId}
                    onPress={() => setChosen(chosen?.shcId === row.eligible.shcId ? null : row.eligible)}
                  />
                ) : (
                  <UnratedRow
                    key={row.eligible.shcId}
                    crop={row.eligible}
                    selected={chosen?.shcId === row.eligible.shcId}
                    onPress={() => setChosen(chosen?.shcId === row.eligible.shcId ? null : row.eligible)}
                  />
                ),
              )}
            </View>
          </ScrollView>
        </>
      )}

      {chosenRow ? (
        <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.lg }]}>
          {chosenRow.ranking?.estimatedProfit != null && field.data ? (
            <Text style={styles.ctaEstimate}>
              {chosenRow.eligible.name} on {field.data.fieldName} could earn about{' '}
              <Text style={styles.ctaAmount}>
                ₹{Math.round(chosenRow.ranking.estimatedProfit).toLocaleString('en-IN')}
              </Text>
            </Text>
          ) : null}
          <Pressable
            style={styles.ctaBtn}
            onPress={() => save.mutate(chosenRow)}
            disabled={save.isPending}
            accessibilityRole="button"
          >
            {save.isPending ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <>
                <Text style={styles.ctaText}>
                  Add {chosenRow.eligible.name} and build its plan
                </Text>
                <MaterialIcons name="arrow-forward" size={20} color={Colors.onPrimary} />
              </>
            )}
          </Pressable>
          {chosenRow.ranking ? (
            <Pressable onPress={() => setDetail(chosenRow.ranking)} accessibilityRole="button">
              <Text style={styles.ctaLink}>See the full picture and what to buy</Text>
            </Pressable>
          ) : null}
        </View>
      ) : (
        <NavScrim />
      )}

      {detail ? (
        <CropSheet
          crop={detail}
          areaAcres={view === 'list' ? (field.data?.areaAcres ?? null) : null}
          onClose={() => setDetail(null)}
        />
      ) : null}
    </View>
  );
}

function Empty({
  icon, title, body,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  body: string;
}) {
  return (
    <View style={styles.empty}>
      <MaterialIcons name={icon} size={44} color={Colors.outlineVariant} />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  headerText: { flex: 1 },
  title: { ...TypeEmphasized.headlineSmall, color: Colors.onSurface },
  subtitle: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: 1 },

  toggle: {
    flexDirection: 'row', backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shape.full, padding: 3,
  },
  toggleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
    paddingHorizontal: Spacing.md, minHeight: 34,
    justifyContent: 'center', borderRadius: Shape.full,
  },
  toggleOn: { backgroundColor: Colors.primary },
  toggleText: { ...Type.labelMedium, color: Colors.onSurfaceVariant },
  toggleTextOn: { ...TypeEmphasized.labelMedium, color: Colors.onPrimary },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg, minHeight: 48,
    borderRadius: Shape.full, backgroundColor: Colors.surfaceContainerHigh,
  },
  searchInput: { ...Type.bodyLarge, flex: 1, color: Colors.onSurface, paddingVertical: Spacing.sm },

  listContent: { paddingHorizontal: Spacing.xl, gap: Spacing.md },
  list: { gap: Spacing.sm },
  coverage: { ...Type.bodySmall, color: Colors.onSurfaceVariant, flex: 1 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  retry: { ...TypeEmphasized.labelMedium, color: Colors.primary },
  loader: { marginTop: Spacing.xxl },

  statePanel: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.sm },
  stateName: { ...TypeEmphasized.headlineSmall, color: Colors.onSurface },
  stateBasis: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginBottom: Spacing.sm },
  hint: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center' },

  cta: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.surfaceContainerLow,
    borderTopLeftRadius: Shape.extraLarge, borderTopRightRadius: Shape.extraLarge,
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.sm,
    ...Elevation.level3,
  },
  ctaEstimate: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  ctaAmount: { ...TypeEmphasized.titleMedium, color: Colors.primary },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    minHeight: 56, borderRadius: Shape.full, backgroundColor: Colors.primary,
  },
  ctaText: { ...TypeEmphasized.titleMedium, color: Colors.onPrimary },
  ctaLink: { ...Type.labelLarge, color: Colors.primary, textAlign: 'center', paddingVertical: Spacing.xs },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.xxl },
  emptyTitle: { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
  emptyBody: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
