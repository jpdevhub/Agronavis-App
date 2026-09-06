import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { DashboardPrice, PriceDirection } from '@agronavis/shared-types';
import { Colors, Shape, Spacing, Type } from '@/constants/theme';
import { Card, Skeleton } from '@/components/ui';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const TREND: Record<PriceDirection, { icon: IconName; color: string; container: string }> = {
  up: { icon: 'trending-up', color: Colors.onSecondaryContainer, container: Colors.secondaryContainer },
  down: { icon: 'trending-down', color: Colors.onErrorContainer, container: Colors.errorContainer },
  stable: { icon: 'trending-flat', color: Colors.onSurfaceVariant, container: Colors.surfaceContainerHighest },
};

const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`;

interface MarketPricesProps {
  prices: DashboardPrice[];
  loading?: boolean;
  live?: boolean;
  onPressCommodity?: (commodity: string) => void;
}

export function MarketPrices({ prices, loading = false, live = false, onPressCommodity }: MarketPricesProps) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.heading}>Mandi prices</Text>
        {live ? (
          <View style={styles.liveTag}>
            <View style={styles.liveDot} />
            <Text style={styles.liveLabel}>Live</Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <View style={styles.row}>
          {[0, 1].map((key) => (
            <Card key={key} variant="filled" style={styles.tile}>
              <Skeleton width="60%" height={12} />
              <Skeleton width="80%" height={22} />
              <Skeleton width="50%" height={12} />
            </Card>
          ))}
        </View>
      ) : prices.length === 0 ? (
        <Card variant="outlined" style={styles.empty}>
          <Text style={styles.emptyText}>
            No mandi data for your state today. Prices refresh each afternoon.
          </Text>
        </Card>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {prices.map((price) => {
            const trend = TREND[price.trend];
            return (
              <Pressable
                key={price.commodity}
                onPress={() => onPressCommodity?.(price.commodity)}
                accessibilityRole="button"
                accessibilityLabel={`${price.commodity}, ${rupees(price.price)} per quintal`}
              >
                <Card variant="filled" style={styles.tile}>
                  <Text style={styles.commodity} numberOfLines={1}>
                    {price.commodity}
                  </Text>
                  <Text style={styles.price}>{rupees(price.price)}</Text>
                  <View style={styles.tileFooter}>
                    <View style={[styles.trendChip, { backgroundColor: trend.container }]}>
                      <MaterialIcons name={trend.icon} size={14} color={trend.color} />
                      <Text style={[styles.trendLabel, { color: trend.color }]}>
                        {price.changePct > 0 ? '+' : ''}
                        {price.changePct}%
                      </Text>
                    </View>
                    <Text style={styles.unit}>per quintal</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  heading: { ...Type.titleMedium, color: Colors.onSurface, flex: 1 },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    height: 24,
    borderRadius: Shape.full,
    backgroundColor: Colors.secondaryContainer,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.primary },
  liveLabel: { ...Type.labelSmall, color: Colors.onSecondaryContainer },
  row: { flexDirection: 'row', gap: Spacing.md, paddingRight: Spacing.lg },
  tile: { width: 160, padding: Spacing.lg, gap: Spacing.xs },
  commodity: { ...Type.labelMedium, color: Colors.onSurfaceVariant, textTransform: 'uppercase' },
  price: { ...Type.headlineSmall, color: Colors.onSurface, fontWeight: '600' },
  tileFooter: { gap: Spacing.xs, marginTop: Spacing.xs },
  trendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    height: 22,
    borderRadius: Shape.full,
  },
  trendLabel: { ...Type.labelSmall },
  unit: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  empty: { padding: Spacing.lg },
  emptyText: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
});
