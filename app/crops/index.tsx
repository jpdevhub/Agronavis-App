import { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, TextInput, ActivityIndicator, } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';
import { showAlert } from '@/utils/alert';
import { useCropCatalog, type CatalogEntry } from '@/hooks/useCropCatalog';
import { cropApi } from '@/services/endpoints';
import { useFarmStore } from '@/store/useFarmStore';

const CATEGORY_ICON: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  cereal: 'grass',
  pulse: 'spa',
  vegetable: 'eco',
  cash_crop: 'local-florist',
  medicinal: 'healing',
  spice: 'local-fire-department',
};

function labelFor(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CropsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const activeFarmId = useFarmStore((s) => s.activeFarmId);
  const activeFieldId = useFarmStore((s) => s.activeFieldId);

  const { entries, categories, isLoading, error, refetch } = useCropCatalog();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter((entry) => {
      const matchCat = category === 'All' || entry.category === category;
      const matchSearch = !term || entry.cropType.toLowerCase().includes(term);
      return matchCat && matchSearch;
    });
  }, [entries, search, category]);

  const save = useMutation({
    mutationFn: async (chosen: CatalogEntry[]) => {
      for (const entry of chosen) {
        await cropApi.create({
          name: entry.cropType,
          category: entry.category,
          variety: entry.varieties[0]?.variety,
          farmId: activeFarmId ?? undefined,
          fieldId: activeFieldId ?? undefined,
        } as never);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crops'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      router.back();
    },
    onError: (e: Error) => showAlert('Could not save', e.message),
  });

  function confirm() {
    const chosen = entries.filter((e) => selected.has(e.cropType));
    if (chosen.length === 0) {
      router.back();
      return;
    }
    save.mutate(chosen);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Your Crops</Text>
        <View style={{ width: 38 }} />
      </View>

      <Text style={styles.headerSub}>
        Choose the crops you are currently managing.
      </Text>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={Colors.outline} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search crops..."
          placeholderTextColor={Colors.outline}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catScroll}
        contentContainerStyle={styles.catContent}
      >
        {['All', ...categories].map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.catChip, category === cat && styles.catChipActive]}
            onPress={() => setCategory(cat)}
            activeOpacity={0.8}
          >
            <Text style={[styles.catText, category === cat && styles.catTextActive]}>
              {cat === 'All' ? 'All' : labelFor(cat)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <View style={styles.stateBox}>
            <MaterialIcons name="cloud-off" size={44} color={Colors.outline} />
            <Text style={styles.stateTitle}>Catalogue unavailable</Text>
            <Text style={styles.stateSub}>{error.message}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.stateBox}>
            <MaterialIcons name="search-off" size={44} color={Colors.outlineVariant} />
            <Text style={styles.stateTitle}>No crops match</Text>
            <Text style={styles.stateSub}>Try a different name or clear the filters.</Text>
          </View>
        ) : (
          <View style={styles.gridInner}>
            {filtered.map((entry) => {
              const isSelected = selected.has(entry.cropType);
              const variety = entry.varieties[0];
              return (
                <TouchableOpacity
                  key={entry.cropType}
                  style={[styles.cropCard, isSelected && styles.cropCardActive]}
                  onPress={() => toggle(entry.cropType)}
                  activeOpacity={0.88}
                >
                  <View style={[styles.selBadge, isSelected && styles.selBadgeActive]}>
                    <MaterialIcons
                      name={isSelected ? 'check' : 'add'}
                      size={14}
                      color={isSelected ? '#fff' : Colors.outline}
                    />
                  </View>
                  <View style={styles.cropGlyph}>
                    <MaterialIcons
                      name={CATEGORY_ICON[entry.category] ?? 'eco'}
                      size={40}
                      color={Colors.primary}
                    />
                  </View>
                  <View style={styles.cropInfo}>
                    <Text style={styles.cropName}>{entry.cropType}</Text>
                    <Text style={styles.cropCategory}>
                      {labelFor(entry.category)}
                      {variety?.growthDurationDays ? ` · ${variety.growthDurationDays} days` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={confirm}
          activeOpacity={0.88}
          disabled={save.isPending}
          style={[styles.confirmBtn, selected.size === 0 && styles.confirmBtnIdle]}
        >
          {save.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.confirmText}>Confirm Selection ({selected.size})</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingBottom: 10,
    backgroundColor: 'rgba(248,249,255,0.95)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  backBtn:        { padding: 8, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh },
  headerTitle:    { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  headerSub:      { fontSize: 14, color: Colors.onSurfaceVariant, paddingHorizontal: 20, marginTop: 10, marginBottom: 6 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 20,
    backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radii.lg, height: 50, paddingHorizontal: 14,
  },
  searchInput:    { flex: 1, fontSize: 15, color: Colors.onSurface },
  catScroll:      { marginTop: 12, maxHeight: 44 },
  catContent:     { paddingHorizontal: 20, gap: 8 },
  catChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerHigh, height: 36, justifyContent: 'center',
  },
  catChipActive:  { backgroundColor: Colors.primary },
  catText:        { fontSize: 13, fontWeight: '600', color: Colors.onSurface },
  catTextActive:  { color: '#fff' },
  grid:           { paddingTop: 14, paddingBottom: 16 },
  gridInner:      { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  cropCard: {
    width: '47%', backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  cropCardActive: { borderColor: Colors.primaryContainer },
  selBadge: {
    position: 'absolute', top: 10, right: 10, zIndex: 2,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  selBadgeActive: { backgroundColor: Colors.primaryContainer, borderColor: 'transparent' },
  cropGlyph: {
    height: 110, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.primaryFixed,
  },
  cropInfo:       { padding: 10 },
  cropName:       { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  cropCategory:   { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },

  stateBox:       { alignItems: 'center', gap: 8, paddingVertical: 48, paddingHorizontal: 32 },
  stateTitle:     { fontSize: 17, fontWeight: '800', color: Colors.onSurface },
  stateSub:       { fontSize: 13, color: Colors.onSurfaceVariant, textAlign: 'center' },
  retryBtn:       { marginTop: 8, backgroundColor: Colors.primaryFixed, borderRadius: Radii.lg, paddingHorizontal: 24, paddingVertical: 10 },
  retryText:      { fontSize: 14, fontWeight: '700', color: Colors.primary },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    backgroundColor: Colors.surface,
  },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: Radii.xxl, gap: 10,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28, shadowRadius: 16, elevation: 6,
  },
  confirmBtnIdle: { backgroundColor: Colors.outlineVariant, shadowOpacity: 0 },
  confirmText:    { fontSize: 16, fontWeight: '700', color: '#fff' },
});
