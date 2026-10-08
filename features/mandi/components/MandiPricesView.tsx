import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { MandiPrice } from '@agronavis/shared-types';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { useMandiSearch } from '../useMandiSearch';
import { MandiFilterModal } from './MandiFilterModal';

const rupees = (value: number) => `₹${Math.round(value).toLocaleString('en-IN')}`;

function PriceRow({ row }: { row: MandiPrice }) {
  const hasRange = row.minPrice > 0 && row.maxPrice > 0 && row.minPrice !== row.maxPrice;

  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <View style={styles.rowMain}>
          <Text style={styles.commodity}>{row.commodity}</Text>
          <Text style={styles.place} numberOfLines={1}>
            {row.marketsReporting > 0
              ? `${row.marketsReporting} mandi${row.marketsReporting === 1 ? '' : 's'} reporting`
              : row.state}
          </Text>
          {/* The feed often repeats the crop as its own variety — "Brinjal,
              variety Brinjal" tells a farmer nothing. */}
          {row.variety &&
          row.variety !== 'Common' &&
          row.variety.toLowerCase() !== row.commodity.toLowerCase() ? (
            <Text style={styles.variety}>{row.variety}</Text>
          ) : null}
        </View>

        <View style={styles.rowPrice}>
          <Text style={styles.modal}>{rupees(row.modalPrice)}</Text>
          <Text style={styles.unit}>per {row.unit.toLowerCase()}</Text>
          {hasRange && (
            <Text style={styles.range}>
              {rupees(row.minPrice)} – {rupees(row.maxPrice)}
            </Text>
          )}
        </View>
      </View>

      {/* Under the price, where the mandis read as where the figure came from
          rather than as the price a farmer would get by going to one of them. */}
      {row.markets.length > 0 && (
        <Text style={styles.markets} numberOfLines={2}>
          {row.markets.join(' · ')}
        </Text>
      )}
    </View>
  );
}

export function MandiPricesView() {
  const {
    rows, filter, setFilter, source, sourceLabel,
    isLoading, isRefetching, error, refetch, needsLocation,
  } = useMandiSearch();
  const [filterOpen, setFilterOpen] = useState(false);

  // Figures are pooled across the state, so that is the only level to pick.
  const place = filter.state;
  const heading = filter.state ? `${filter.state} prices` : '';

  return (
    <View style={styles.root}>
      <Pressable style={styles.locationBar} onPress={() => setFilterOpen(true)}>
        <MaterialIcons name="location-on" size={20} color={Colors.primary} />
        <View style={styles.locationText}>
          <Text style={styles.locationPlace} numberOfLines={1}>
            {heading || 'Choose a state'}
          </Text>
          {sourceLabel ? <Text style={styles.locationSource}>{sourceLabel}</Text> : null}
        </View>
        <MaterialIcons name="tune" size={20} color={Colors.onSurfaceVariant} />
      </Pressable>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[Colors.primary]} />
        }
      >
        {needsLocation ? (
          <Empty
            icon="location-searching"
            title="Where do you sell?"
            body="Pick a state and district to see today's mandi rates."
            actionLabel="Choose a mandi"
            onAction={() => setFilterOpen(true)}
          />
        ) : isLoading ? (
          <Empty icon="hourglass-empty" title="Fetching rates" body="Checking Agmarknet and eNAM." />
        ) : error ? (
          <Empty
            icon="cloud-off"
            title="Could not load prices"
            body={(error as Error).message}
            actionLabel="Try again"
            onAction={() => refetch()}
          />
        ) : rows.length === 0 && source === 'unconfigured' ? (
          <Empty
            icon="cloud-off"
            title="Rates unavailable"
            body="No mandi price source is connected yet, so no district will show rates. Mandi and crop lists still work."
          />
        ) : rows.length === 0 ? (
          <Empty
            icon="storefront"
            title="No rates reported"
            body={`No mandi in ${place} has reported today. Try a nearby district.`}
            actionLabel="Change mandi"
            onAction={() => setFilterOpen(true)}
          />
        ) : (
          rows.map((row, i) => <PriceRow key={`${row.commodity}-${row.market}-${i}`} row={row} />)
        )}
      </ScrollView>

      <MandiFilterModal
        visible={filterOpen}
        initial={filter}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilter(next);
          setFilterOpen(false);
        }}
      />
    </View>
  );
}

function Empty({
  icon, title, body, actionLabel, onAction,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name={icon} size={30} color={Colors.onSecondaryContainer} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.emptyBtn}>
          <Text style={styles.emptyBtnText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  locationBar: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginHorizontal: Spacing.xl, marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Shape.full, backgroundColor: Colors.surfaceContainerHigh,
  },
  locationText: { flex: 1 },
  locationPlace: { ...TypeEmphasized.titleSmall, color: Colors.onSurface },
  locationSource: { ...Type.labelMedium, color: Colors.onSurfaceVariant, marginTop: 1 },

  list: { paddingHorizontal: Spacing.xl, gap: Spacing.sm, paddingBottom: Spacing.xl },
  row: {
    gap: Spacing.sm,
    padding: Spacing.lg, borderRadius: Shape.extraLarge,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  markets: {
    ...Type.bodySmall, color: Colors.outline,
    paddingTop: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
  },
  rowMain: { flex: 1, gap: 2 },
  commodity: { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
  place: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  variety: { ...Type.labelSmall, color: Colors.outline },
  rowPrice: { alignItems: 'flex-end' },
  modal: { ...TypeEmphasized.titleLarge, color: Colors.primary },
  unit: { ...Type.labelSmall, color: Colors.onSurfaceVariant },
  range: { ...Type.labelSmall, color: Colors.outline, marginTop: 2 },

  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxxl },
  emptyIcon: {
    width: 64, height: 64, borderRadius: Shape.full,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm,
  },
  emptyTitle: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  emptyBody: {
    ...Type.bodyMedium, color: Colors.onSurfaceVariant,
    textAlign: 'center', maxWidth: 300,
  },
  emptyBtn: {
    marginTop: Spacing.md, height: 48, paddingHorizontal: Spacing.xl,
    borderRadius: Shape.full, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyBtnText: { ...TypeEmphasized.labelLarge, color: Colors.onPrimary },
});
