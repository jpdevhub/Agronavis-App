import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/useGoBack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { AppNotification } from '@agronavis/shared-types';
import { EmptyState, Loader } from '@/components/ui';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { useNotifications } from '@/hooks/useNotifications';

/** Which icon an alert wears, by the kind of thing it is about. */
const LOOK: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  irrigation: 'water-drop',
  weather_alert: 'thunderstorm',
  pest_control: 'coronavirus',
  general: 'eco',
};

/**
 * Urgency, shown rather than described. Critical and high were pushed to the
 * handset; medium and low were not, so the list is the only place they appear
 * and has to make the difference visible at a glance.
 */
const URGENCY: Record<string, { tint: string; ground: string; label?: string }> = {
  critical: { tint: Colors.onErrorContainer, ground: Colors.errorContainer, label: 'Act today' },
  high: { tint: Colors.onTertiaryContainer, ground: Colors.tertiaryContainer, label: 'Soon' },
  medium: { tint: Colors.primary, ground: Colors.secondaryContainer },
  low: { tint: Colors.onSurfaceVariant, ground: Colors.surfaceContainerHigh },
};

function when(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** How far apart the rows arrive, and how long each takes. */
const STAGGER_MS = 45;
const ENTER_MS = 240;

function AlertRow({
  alert,
  index,
  onPress,
}: {
  alert: AppNotification;
  index: number;
  onPress: () => void;
}) {
  /**
   * Rises into place rather than appearing. A list that arrives in order reads
   * as newest-first; one that materialises whole reads as a screen that was
   * already there and leaves the eye no starting point. Capped so a long
   * history does not stagger for a second and a half.
   */
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(enter, {
      toValue: 1,
      duration: ENTER_MS,
      delay: Math.min(index, 8) * STAGGER_MS,
      easing: Easing.out(Easing.cubic),
      // No native animated module on web; asking for one logs a warning on
      // every mount before falling back to JS regardless.
      useNativeDriver: Platform.OS !== 'web',
    });
    animation.start();
    return () => animation.stop();
  }, [enter, index]);
  const icon = LOOK[alert.type] ?? LOOK.general!;
  const urgency = URGENCY[alert.severity] ?? URGENCY.medium!;
  return (
    <Animated.View
      style={{
        opacity: enter,
        transform: [
          { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
        ],
      }}
    >
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.row, !alert.read && styles.rowUnread]}
    >
      <View style={[styles.icon, { backgroundColor: urgency.ground }]}>
        <MaterialIcons name={icon} size={20} color={urgency.tint} />
      </View>
      <View style={styles.rowText}>
        <View style={styles.rowHead}>
          <Text style={[styles.title, !alert.read && styles.titleUnread]} numberOfLines={2}>
            {alert.title}
          </Text>
          {!alert.read ? <View style={styles.dot} /> : null}
        </View>
        <Text style={styles.body}>{alert.body}</Text>
        <View style={styles.rowFoot}>
          {urgency.label ? (
            <Text style={[styles.urgency, { color: urgency.tint, backgroundColor: urgency.ground }]}>
              {urgency.label}
            </Text>
          ) : null}
          <Text style={styles.when}>{when(alert.createdAt)}</Text>
        </View>
      </View>
    </Pressable>
    </Animated.View>
  );
}

export default function AlertsScreen() {
  const router = useRouter();
  const goBack = useGoBack('/(tabs)/dashboard');
  const insets = useSafeAreaInsets();
  const { notifications, unread, isLoading, error, refetch, markRead, markAllRead, isMarkingAll } =
    useNotifications();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => goBack()}
          style={styles.back}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Alerts</Text>
          <Text style={styles.headerSub}>
            {unread > 0 ? `${unread} unread` : 'All caught up'}
          </Text>
        </View>
        {unread > 0 && !isMarkingAll ? (
          <Pressable onPress={() => markAllRead()} hitSlop={8} accessibilityRole="button">
            <Text style={styles.markAll}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.centre}>
          <Loader size={48} />
        </View>
      ) : error ? (
        <EmptyState
          icon="cloud-off"
          title="Could not load your alerts"
          description={error.message}
          actionLabel="Try again"
          onAction={() => refetch()}
        />
      ) : notifications.length === 0 ? (
        // Inside a scroll view purely so it can be pulled. This is the one
        // screen where someone is waiting for something to arrive — a welcome
        // that is still in flight, a first advisory — and leaving the screen
        // and coming back was the only way to look again.
        <ScrollView
          contentContainerStyle={styles.emptyScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          <EmptyState
            icon="notifications-none"
            title="Nothing yet"
            description="Irrigation reminders, disease warnings and weather alerts for your fields will appear here. Pull down to check."
          />
        </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + Spacing.xxxl }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
        >
          {notifications.map((alert, i) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              index={i}
              onPress={() => {
                if (!alert.read) markRead(alert.id);
              }}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.outlineVariant,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: Shape.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  headerText: { flex: 1 },
  headerTitle: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  headerSub: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  markAll: { ...Type.labelLarge, color: Colors.primary },

  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Grows to fill so the empty state stays centred and still accepts a pull.
  emptyScroll: { flexGrow: 1, justifyContent: 'center' },
  list: { padding: Spacing.lg, gap: Spacing.sm },

  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Shape.large,
    backgroundColor: Colors.surfaceContainerLow,
  },
  rowUnread: { backgroundColor: Colors.surfaceContainerHigh },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Shape.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  rowHead: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  title: { ...Type.titleSmall, color: Colors.onSurface, flex: 1 },
  titleUnread: { ...TypeEmphasized.titleSmall, color: Colors.onSurface, flex: 1 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 6,
  },
  body: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  rowFoot: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  urgency: {
    ...Type.labelSmall,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Shape.small,
    overflow: 'hidden',
  },
  when: { ...Type.bodySmall, color: Colors.outline },
});
