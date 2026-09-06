import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Card, Chip, EmptyState, Skeleton } from '@/components/ui';
import { Colors, Radii, Shape, Spacing, Type } from '@/constants/theme';
import { useCropCatalog, type CatalogEntry } from '@/hooks/useCropCatalog';

const CROP_ICON: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  cereal: 'grass',
  pulse: 'spa',
  vegetable: 'eco',
  cash_crop: 'local-florist',
  medicinal: 'healing',
  spice: 'local-fire-department',
};

function labelFor(category: string): string {
  return category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function CropCatalogScreen() {
  const router = useRouter();
  const { entries, categories, isLoading, error, refetch } = useCropCatalog();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (category && entry.category !== category) return false;
      if (!term) return true;
      return (
        entry.cropType.toLowerCase().includes(term) ||
        entry.varieties.some((v) => v.variety.toLowerCase().includes(term))
      );
    });
  }, [entries, search, category]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Crop catalogue</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={Colors.onSurfaceVariant} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search a crop or variety"
          placeholderTextColor={Colors.onSurfaceVariant}
          style={styles.searchInput}
          returnKeyType="search"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} accessibilityLabel="Clear search">
            <MaterialIcons name="close" size={20} color={Colors.onSurfaceVariant} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {categories.map((c) => (
          <Chip
            key={c}
            label={labelFor(c)}
            selected={category === c}
            onPress={() => setCategory(category === c ? null : c)}
          />
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          [0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeleton}>
              <Skeleton height={76} radius={Radii.lg} />
            </View>
          ))
        ) : error ? (
          <EmptyState
            icon="cloud-off"
            title="Catalogue unavailable"
            description={error.message}
            actionLabel="Try again"
            onAction={() => refetch()}
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon="search-off"
            title="Nothing matches"
            description="No crop in the catalogue matches that search. Try a different name or clear the filters."
          />
        ) : (
          visible.map((entry) => (
            <CropRow
              key={entry.cropType}
              entry={entry}
              open={expanded === entry.cropType}
              onToggle={() => setExpanded(expanded === entry.cropType ? null : entry.cropType)}
            />
          ))
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

function CropRow({
  entry,
  open,
  onToggle,
}: {
  entry: CatalogEntry;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <Card variant={open ? 'filled' : 'outlined'} style={styles.card}>
      <Pressable onPress={onToggle} style={styles.cardHead} accessibilityRole="button">
        <View style={styles.iconWrap}>
          <MaterialIcons
            name={CROP_ICON[entry.category] ?? 'eco'}
            size={22}
            color={Colors.onPrimaryContainer}
          />
        </View>
        <View style={styles.cardTitleGroup}>
          <Text style={styles.cropName}>{entry.cropType}</Text>
          <Text style={styles.cropMeta}>
            {labelFor(entry.category)} · {entry.varieties.length}{' '}
            {entry.varieties.length === 1 ? 'variety' : 'varieties'}
          </Text>
        </View>
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={24}
          color={Colors.onSurfaceVariant}
        />
      </Pressable>

      {open
        ? entry.varieties.map((variety) => (
            <View key={variety.id} style={styles.variety}>
              <View style={styles.varietyHead}>
                <Text style={styles.varietyName}>{variety.variety}</Text>
                {variety.seasons.length ? (
                  <Text style={styles.varietySeason}>{variety.seasons.join(', ')}</Text>
                ) : null}
              </View>
              <View style={styles.stats}>
                <Stat
                  label="Duration"
                  value={variety.growthDurationDays ? `${variety.growthDurationDays} d` : '—'}
                />
                <Stat
                  label="Yield"
                  value={
                    variety.avgYieldPerAcre
                      ? `${variety.avgYieldPerAcre} ${variety.yieldUnit ?? ''}/ac`.trim()
                      : '—'
                  }
                />
                <Stat
                  label="Water"
                  value={variety.waterRequirementMm ? `${variety.waterRequirementMm} mm` : '—'}
                />
                <Stat
                  label="Ideal pH"
                  value={
                    variety.idealPh.min !== null && variety.idealPh.max !== null
                      ? `${variety.idealPh.min}–${variety.idealPh.max}`
                      : '—'
                  }
                />
              </View>
              <Text style={styles.npk}>
                N {variety.nutrientsKgPerAcre.n ?? '—'} · P {variety.nutrientsKgPerAcre.p ?? '—'} · K{' '}
                {variety.nutrientsKgPerAcre.k ?? '—'} kg/acre
              </Text>
            </View>
          ))
        : null}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  headerTitle: { ...Type.titleLarge, color: Colors.onSurface },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 44 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    height: 52,
    borderRadius: Shape.full,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  searchInput: { flex: 1, ...Type.bodyLarge, color: Colors.onSurface },

  filters: { gap: Spacing.sm, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },

  scroll: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  skeleton: { marginBottom: Spacing.md },
  card: { paddingVertical: Spacing.sm },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Shape.full,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitleGroup: { flex: 1, gap: 2 },
  cropName: { ...Type.titleMedium, color: Colors.onSurface },
  cropMeta: { ...Type.bodySmall, color: Colors.onSurfaceVariant },

  variety: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    gap: Spacing.sm,
  },
  varietyHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  varietyName: { ...Type.titleSmall, color: Colors.onSurface },
  varietySeason: { ...Type.labelSmall, color: Colors.onSurfaceVariant, textTransform: 'capitalize' },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  stat: { minWidth: 72, gap: 2 },
  statLabel: { ...Type.labelSmall, color: Colors.onSurfaceVariant },
  statValue: { ...Type.bodyMedium, color: Colors.onSurface },
  npk: { ...Type.bodySmall, color: Colors.onSurfaceVariant },

  bottomSpace: { height: Spacing.xxxl },
});
