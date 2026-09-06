import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Advisory, AdvisoryCategory, AdvisorySeverity } from '@agronavis/shared-types';
import { Colors, Severity, Shape, Spacing, Type } from '@/constants/theme';
import { Button, Card, Skeleton } from '@/components/ui';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const CATEGORY_ICON: Record<AdvisoryCategory, IconName> = {
  irrigation: 'water-drop',
  fertilizer: 'science',
  pest_control: 'pest-control',
  weather_alert: 'thunderstorm',
  market: 'storefront',
  scheme: 'account-balance',
};

const SEVERITY_LABEL: Record<AdvisorySeverity, string> = {
  critical: 'Act today',
  high: 'Act soon',
  medium: 'Keep an eye',
  low: 'For information',
};

interface AdvisoryCardProps {
  advisory: Advisory | null;
  unreadCount: number;
  loading?: boolean;
  onMarkRead: (id: string) => void;
  onSeeAll?: () => void;
}

export function AdvisoryCard({
  advisory,
  unreadCount,
  loading = false,
  onMarkRead,
  onSeeAll,
}: AdvisoryCardProps) {
  if (loading) {
    return (
      <Card variant="filled" style={styles.card}>
        <Skeleton width="45%" height={14} />
        <Skeleton width="85%" height={20} />
        <Skeleton width="100%" height={40} />
      </Card>
    );
  }

  if (!advisory) {
    return (
      <Card variant="outlined" style={styles.card}>
        <View style={styles.header}>
          <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
          <Text style={styles.clearTitle}>Nothing needs your attention</Text>
        </View>
        <Text style={styles.clearBody}>
          Water balance and the five-day forecast both look normal for your field.
        </Text>
      </Card>
    );
  }

  const tone = Severity[advisory.severity];

  return (
    <Card variant="filled" style={[styles.card, { backgroundColor: tone.container }]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: tone.accent }]}>
          <MaterialIcons name={CATEGORY_ICON[advisory.category]} size={18} color={Colors.onPrimary} />
        </View>
        <Text style={[styles.severity, { color: tone.on }]}>{SEVERITY_LABEL[advisory.severity]}</Text>
        {unreadCount > 1 ? (
          <View style={[styles.badge, { backgroundColor: tone.accent }]}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        ) : null}
      </View>

      <Text style={[styles.title, { color: tone.on }]}>{advisory.title}</Text>
      <Text style={[styles.body, { color: tone.on }]} numberOfLines={3}>
        {advisory.body}
      </Text>

      <View style={styles.actions}>
        <Button label="Mark as done" variant="text" onPress={() => onMarkRead(advisory.id)} />
        {unreadCount > 1 && onSeeAll ? (
          <Button label={`See all ${unreadCount}`} variant="text" onPress={onSeeAll} />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: Spacing.lg, gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: Shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  severity: { ...Type.labelMedium, textTransform: 'uppercase', flex: 1 },
  badge: { minWidth: 22, height: 22, borderRadius: Shape.full, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  badgeText: { ...Type.labelSmall, color: Colors.onPrimary },
  title: { ...Type.titleMedium },
  body: { ...Type.bodyMedium, opacity: 0.9 },
  actions: { flexDirection: 'row', marginTop: Spacing.xs, marginLeft: -Spacing.md },
  clearTitle: { ...Type.titleSmall, color: Colors.onSurface },
  clearBody: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
});
