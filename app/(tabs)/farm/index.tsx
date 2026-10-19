import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isPlausibleField } from '@/constants/field';
import { SAHAYAK_FAB_SPACE } from '@/features/sahayak';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import type { Farm, FarmField } from '@agronavis/shared-types';
import { Colors, Elevation, Radii, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { farmApi } from '@/services/endpoints';
import { useAuthStore } from '@/store/useAuthStore';
import { Avatar, Loader } from '@/components/ui';
import { useFarmer } from '@/hooks/useFarmer';
import { useDeleteField } from '@/hooks/useFarmFields';
import { useFarmStore } from '@/store/useFarmStore';
import { confirmAction } from '@/utils/alert';

type FarmWithFields = Farm & { fields: FarmField[] };

export default function MyFarmsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const user = useAuthStore((s) => s.user);
  const { activeFieldId, setActiveField, clearActiveField } = useFarmStore();
  const [refreshing, setRefreshing] = useState(false);
  const deleteField = useDeleteField();
  const { data: farmer } = useFarmer();

  const farmsQuery = useQuery({
    queryKey: ['farms', user?.id],
    queryFn: farmApi.list,
    enabled: !!user?.id,
  });
  const fieldsQuery = useQuery({
    queryKey: ['fields', user?.id],
    queryFn: farmApi.listFields,
    enabled: !!user?.id,
  });

  const loading = farmsQuery.isLoading || fieldsQuery.isLoading;
  const error = farmsQuery.error ?? fieldsQuery.error;

  const farms = useMemo<FarmWithFields[]>(() => {
    const byFarm = new Map<string, FarmField[]>();
    for (const field of fieldsQuery.data ?? []) {
      const list = byFarm.get(field.farmId);
      if (list) list.push(field);
      else byFarm.set(field.farmId, [field]);
    }
    return (farmsQuery.data ?? []).map((farm) => ({ ...farm, fields: byFarm.get(farm.id) ?? [] }));
  }, [farmsQuery.data, fieldsQuery.data]);

  const refetch = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([farmsQuery.refetch(), fieldsQuery.refetch()]);
    setRefreshing(false);
  }, [farmsQuery, fieldsQuery]);

  // Auto-select the first field once, so the dashboard has something to show.
  useEffect(() => {
    if (activeFieldId || farms.length === 0) return;
    const first = farms.find((f) => f.fields.length > 0);
    if (first) setActiveField(first.fields[0].id, first.id);
  }, [farms, activeFieldId, setActiveField]);

  function removeField(id: string, name: string) {
    confirmAction(
      'Delete field',
      `Remove "${name}" and its mapped boundary? This cannot be undone.`,
      'Delete',
      () => deleteField.mutate(id),
    );
  }

  const totalFields = farms.reduce((s, f) => s + f.fields.length, 0);
  // Boundaries traced on a zoomed-out map would otherwise dominate the total.
  const totalAcres = farms.reduce(
    (s, f) => s + f.fields.filter((ff) => isPlausibleField(ff.areaAcres)).reduce((a, ff) => a + ff.areaAcres, 0),
    0,
  );

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.logo}>My Farms</Text>
          {!loading && (
            <Text style={styles.topSub}>
              {totalFields} field{totalFields !== 1 ? 's' : ''} · {totalAcres.toFixed(1)} acres
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={() => router.push('/profile' as any)} activeOpacity={0.85}>
          <Avatar uri={farmer?.avatarUrl} name={farmer?.fullName} size={40} />
        </TouchableOpacity>
      </View>

      <View style={styles.subNav}>
        {[
          { label: 'Overview', icon: 'home',   route: '/(tabs)/farm' },
          { label: 'Map',      icon: 'map',    route: '/(tabs)/farm/map' },
          { label: 'Fields',   icon: 'layers', route: '/(tabs)/farm/fields' },
        ].map(({ label, icon, route }) => (
          <TouchableOpacity
            key={label}
            style={[styles.subNavBtn, route === '/(tabs)/farm' && styles.subNavBtnActive]}
            onPress={() => router.push(route as any)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name={icon as any}
              size={18}
              color={route === '/(tabs)/farm' ? Colors.primary : Colors.onSurfaceVariant}
            />
            <Text style={[styles.subNavLabel, route === '/(tabs)/farm' && styles.subNavLabelActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <Loader size={48} />
          <Text style={styles.loadingText}>Loading your farms…</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <MaterialIcons name="cloud-off" size={48} color={Colors.outline} />
          <Text style={styles.errorText}>{(error as Error).message}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : farms.length === 0 ? (
        <View style={styles.center}>
          <MaterialIcons name="agriculture" size={64} color={Colors.primaryFixed} />
          <Text style={styles.emptyTitle}>No farms yet</Text>
          <Text style={styles.emptyText}>
            Tap Map New Field to draw your first farm boundary on the satellite map.
          </Text>
          <TouchableOpacity
            style={styles.emptyBtn}
            onPress={() => router.push('/(tabs)/farm/map' as any)}
            activeOpacity={0.88}
          >
            <MaterialIcons name="add-location-alt" size={20} color="#fff" />
            <Text style={styles.emptyBtnText}>Map New Field</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} colors={[Colors.primary]} />}
        >
          {farms.map((farm) => (
            <View key={farm.id} style={styles.farmSection}>
              <View style={styles.farmHeader}>
                <View style={styles.farmIconWrap}>
                  <MaterialIcons name="agriculture" size={22} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.farmName}>{farm.name}</Text>
                  <Text style={styles.farmMeta}>
                    {farm.fields.length} field{farm.fields.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>

              {farm.fields.length === 0 ? (
                <View style={styles.noFieldsCard}>
                  <Text style={styles.noFieldsText}>No fields mapped yet.</Text>
                </View>
              ) : (
                farm.fields.map((field) => {
                  const isActive = activeFieldId === field.id;
                  return (
                    <TouchableOpacity
                      key={field.id}
                      style={[styles.fieldCard, isActive && styles.fieldCardActive]}
                      onPress={() => (isActive ? clearActiveField() : setActiveField(field.id, farm.id))}
                      activeOpacity={0.85}
                    >
                      <View style={styles.fieldCardLeft}>
                        <View style={[styles.fieldIconWrap, isActive && styles.fieldIconActive]}>
                          <MaterialIcons
                            name="crop-free"
                            size={20}
                            color={isActive ? Colors.onPrimary : Colors.primary}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.fieldName, isActive && styles.fieldNameActive]}>
                            {field.name}
                          </Text>
                          {isPlausibleField(field.areaAcres) ? (
                            <Text style={styles.fieldMeta}>
                              {field.areaAcres.toFixed(2)} acres
                              {field.centerLatitude !== null
                                ? ` · ${field.centerLatitude.toFixed(4)}°N`
                                : ''}
                            </Text>
                          ) : (
                            <View style={styles.remapRow}>
                              <MaterialIcons name="error-outline" size={13} color={Colors.error} />
                              <Text style={styles.remapText}>Boundary looks wrong — remap this field</Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.fieldCardRight}>
                        {isActive && (
                          <View style={styles.activeBadge}>
                            <Text style={styles.activeBadgeText}>Active</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          onPress={() => removeField(field.id, field.name)}
                          style={styles.deleteBtn}
                          hitSlop={8}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${field.name}`}
                        >
                          <MaterialIcons name="delete-outline" size={20} color={Colors.error} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          ))}

          {/*
            At the end of the list rather than floating over it. A floating
            button has to be placed around the tab bar and the Sahayak pill,
            and it lost that argument twice — landing on top of one or the
            other. Sitting where the list ends it cannot collide with
            anything, and it reads as the next item: the fields, then the way
            to add one more. The empty state has carried its own copy all
            along, which is the same idea.
          */}
          {!loading && farms.length > 0 && (
            <TouchableOpacity
              style={styles.addField}
              onPress={() => router.push('/(tabs)/farm/map' as any)}
              activeOpacity={0.9}
              accessibilityRole="button"
              accessibilityLabel="Map a new field"
            >
              <MaterialIcons name="add-location-alt" size={22} color={Colors.onPrimary} />
              <Text style={styles.addFieldLabel}>Map New Field</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: tabBarHeight + SAHAYAK_FAB_SPACE }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },

  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 14,
    backgroundColor: Colors.surface,
    ...Elevation.level1,
  },
  logo:    { ...TypeEmphasized.headlineSmall, color: Colors.onSurface },
  topSub:  { ...Type.labelMedium, color: Colors.onSurfaceVariant, marginTop: 2 },
  notifBtn:{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  subNav: {
    flexDirection: 'row', backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 10, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  subNavBtn:       { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 },
  subNavBtnActive: { borderBottomWidth: 2, borderBottomColor: Colors.primary },
  subNavLabel:     { ...TypeEmphasized.labelSmall, color: Colors.onSurfaceVariant },
  subNavLabelActive: { color: Colors.primary },

  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 12, paddingHorizontal: 40,
  },
  loadingText: { ...Type.labelLarge, color: Colors.onSurfaceVariant },
  errorText:   { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center' },
  retryBtn:    { backgroundColor: Colors.primaryFixed, borderRadius: Radii.lg, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:   { ...TypeEmphasized.labelLarge, color: Colors.primary },

  emptyTitle:  { ...TypeEmphasized.titleLarge, color: Colors.onSurface, textAlign: 'center' },
  emptyText:   { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center' },
  emptyBtn: {
    marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 22, paddingVertical: 14, borderRadius: Radii.xl,
    backgroundColor: Colors.primary,
  },
  emptyBtnText:{ ...TypeEmphasized.titleSmall, color: Colors.onPrimary },

  scroll: { paddingHorizontal: 16, paddingTop: 16, gap: 20 },

  farmSection: { gap: 10 },
  farmHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 6,
  },
  farmIconWrap: {
    width: 42, height: 42, borderRadius: Shape.large,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  farmName: { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
  farmMeta: { ...Type.labelMedium, color: Colors.onSurfaceVariant, marginTop: 1 },

  noFieldsCard: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.xl, padding: 20, alignItems: 'center',
  },
  noFieldsText: { ...Type.bodySmall, color: Colors.onSurfaceVariant },

  fieldCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: Colors.outlineVariant,
    ...Elevation.level1,
  },
  fieldCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryFixed,
  },
  fieldCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  fieldCardRight:{ flexDirection: 'row', alignItems: 'center', gap: 8 },
  deleteBtn:     { width: 36, height: 36, borderRadius: Shape.full, alignItems: 'center', justifyContent: 'center' },

  fieldIconWrap: {
    width: 40, height: 40, borderRadius: Shape.medium,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  fieldIconActive: { backgroundColor: Colors.primary },

  fieldName:       { ...TypeEmphasized.titleSmall, color: Colors.onSurface },
  fieldNameActive: { color: Colors.primary },
  fieldMeta:       { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: 2 },
  remapRow:        { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  remapText:       { ...Type.bodySmall, color: Colors.error },

  activeBadge: {
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  activeBadgeText: { ...TypeEmphasized.labelSmall, color: Colors.onPrimary },

  addField: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing.xl,
    // Same radius as the cards above it, so it reads as the last row of the
    // list rather than something laid on top.
    borderRadius: Shape.extraLarge,
    backgroundColor: Colors.primary,
    ...Elevation.level1,
  },
  addFieldLabel: { ...TypeEmphasized.titleSmall, color: Colors.onPrimary },
});
