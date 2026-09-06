import { useCallback, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { FarmTask, NutrientLevel, PestAlertEvent } from '@agronavis/shared-types';
import { Colors, Elevation, Shape, Spacing, Type } from '@/constants/theme';
import { Button, Card, EmptyState, Skeleton, Surface } from '@/components/ui';
import { AdvisoryCard } from '@/components/dashboard/AdvisoryCard';
import { ForecastStrip, weatherIcon } from '@/components/dashboard/ForecastStrip';
import { MarketPrices } from '@/components/dashboard/MarketPrices';
import { PestAlertBanner } from '@/components/PestAlertBanner';
import { useAdvisories } from '@/hooks/useAdvisories';
import { useFarmer } from '@/hooks/useFarmer';
import { useFarmFields } from '@/hooks/useFarmFields';
import { useMarketPrices } from '@/hooks/useMarketPrices';
import { useNotifications } from '@/hooks/useNotifications';
import { useSoilHealth } from '@/hooks/useSoilHealth';
import { useTimelineTasks } from '@/hooks/useTimelineTasks';
import { useWeather } from '@/hooks/useWeather';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useFarmStore } from '@/store/useFarmStore';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

const NUTRIENT_TONE: Record<NutrientLevel, { container: string; on: string }> = {
  High: { container: Colors.secondaryContainer, on: Colors.onSecondaryContainer },
  Medium: { container: Colors.tertiaryContainer, on: Colors.onTertiaryContainer },
  Low: { container: Colors.errorContainer, on: Colors.onErrorContainer },
  'N/A': { container: Colors.surfaceContainerHighest, on: Colors.onSurfaceVariant },
};

const TASK_ICON: Record<string, IconName> = {
  fertilizer_application: 'science',
  pest_scan: 'pest-control',
  irrigation: 'water-drop',
  sowing: 'agriculture',
  harvesting: 'grass',
  soil_prep: 'terrain',
  market_prep: 'storefront',
};

function NutrientTile({ label, level }: { label: string; level: NutrientLevel }) {
  const tone = NUTRIENT_TONE[level];
  return (
    <View style={[styles.nutrient, { backgroundColor: tone.container }]}>
      <Text style={[styles.nutrientValue, { color: tone.on }]}>{level}</Text>
      <Text style={[styles.nutrientLabel, { color: tone.on }]}>{label}</Text>
    </View>
  );
}

function TaskRow({ task, onComplete }: { task: FarmTask; onComplete: () => void }) {
  const overdue = task.status === 'overdue';
  const due = new Date(`${task.dueDate}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <Card variant="outlined" style={styles.task}>
      <View style={[styles.taskIcon, overdue && { backgroundColor: Colors.errorContainer }]}>
        <MaterialIcons
          name={TASK_ICON[task.taskType ?? ''] ?? 'event-note'}
          size={20}
          color={overdue ? Colors.onErrorContainer : Colors.onSecondaryContainer}
        />
      </View>

      <View style={styles.taskBody}>
        <Text style={styles.taskTitle} numberOfLines={1}>
          {task.title}
        </Text>
        <Text style={[styles.taskDue, overdue && { color: Colors.error }]}>
          {overdue ? `Overdue since ${due}` : `Due ${due}`}
        </Text>
      </View>

      <Pressable
        onPress={onComplete}
        accessibilityRole="button"
        accessibilityLabel={`Mark ${task.title} complete`}
        hitSlop={8}
        style={styles.taskDone}
      >
        <MaterialIcons name="check" size={18} color={Colors.onPrimary} />
      </Pressable>
    </Card>
  );
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const activeFieldId = useFarmStore((s) => s.activeFieldId);
  const activeFarmId = useFarmStore((s) => s.activeFarmId);
  const setActiveField = useFarmStore((s) => s.setActiveField);

  const [pestAlert, setPestAlert] = useState<PestAlertEvent | null>(null);

  const { data: farmer, isLoading: farmerLoading } = useFarmer();
  const { data: fields, isLoading: fieldsLoading, refetch: refetchFields } = useFarmFields();
  const { data: tasks, isLoading: tasksLoading, completeTask } = useTimelineTasks();
  const { levels, isLoading: soilLoading, isRegional } = useSoilHealth();
  const { current, forecast, isLoading: weatherLoading, isStale } = useWeather(activeFarmId);
  const { topUnread, unreadCount, isLoading: advisoryLoading, markRead, refresh } = useAdvisories();
  const { unreadCount: notificationCount } = useNotifications();

  const activeField = useMemo(
    () => fields?.find((field) => field.id === activeFieldId) ?? null,
    [fields, activeFieldId],
  );

  const { data: prices, isLoading: pricesLoading } = useMarketPrices(
    farmer?.state,
    farmer?.primaryCrops?.length ? farmer.primaryCrops : undefined,
  );

  const socket = useWebSocket({
    farmId: activeFarmId ?? undefined,
    district: farmer?.district ?? undefined,
    state: farmer?.state ?? undefined,
    onPestAlert: setPestAlert,
  });

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchFields(), activeFarmId ? refresh.mutateAsync() : Promise.resolve()]);
  }, [refetchFields, refresh, activeFarmId]);

  const hasFields = (fields?.length ?? 0) > 0;
  const firstName = farmer?.fullName?.split(' ')[0];
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <PestAlertBanner
        alert={pestAlert}
        onDismiss={() => setPestAlert(null)}
        onViewDetails={() => router.push('/(tabs)/scan' as never)}
      />

      <View style={[styles.appBar, { paddingTop: insets.top + Spacing.sm }]}>
        <Pressable
          onPress={() => router.push('/profile' as never)}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
        >
          {farmerLoading ? (
            <Skeleton width={40} height={40} radius={Shape.full} />
          ) : farmer?.avatarUrl ? (
            <Image source={{ uri: farmer.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitial}>{(firstName ?? 'F').charAt(0).toUpperCase()}</Text>
            </View>
          )}
        </Pressable>

        <View style={styles.appBarTitle}>
          <Text style={styles.wordmark}>Agronavis</Text>
          {socket.connected ? (
            <View style={styles.liveDot} accessibilityLabel="Live updates connected" />
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          style={styles.iconButton}
        >
          <MaterialIcons name="notifications-none" size={24} color={Colors.onSurfaceVariant} />
          {notificationCount > 0 ? (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationCount}>
                {notificationCount > 9 ? '9+' : notificationCount}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 96 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refresh.isPending}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        <View style={styles.greeting}>
          {farmerLoading ? (
            <Skeleton width={220} height={30} />
          ) : (
            <Text style={styles.greetingText}>
              {firstName ? `Good day, ${firstName}` : 'Good day'}
            </Text>
          )}
          <Text style={styles.greetingDate}>{today}</Text>
        </View>

        <Card variant="filled" style={styles.weatherCard}>
          {weatherLoading ? (
            <View style={styles.weatherLoading}>
              <Skeleton width={110} height={44} />
              <Skeleton width={140} height={16} />
            </View>
          ) : current ? (
            <>
              <View style={styles.weatherTop}>
                <View style={styles.weatherReading}>
                  <Text style={styles.temperature}>{current.temp}°</Text>
                  <Text style={styles.condition}>{current.description}</Text>
                </View>
                <MaterialIcons
                  name={weatherIcon(current.icon)}
                  size={56}
                  color={Colors.onPrimaryContainer}
                />
              </View>

              <View style={styles.weatherMetrics}>
                <View style={styles.metric}>
                  <MaterialIcons name="water-drop" size={15} color={Colors.onPrimaryContainer} />
                  <Text style={styles.metricText}>{current.humidity}%</Text>
                </View>
                <View style={styles.metric}>
                  <MaterialIcons name="air" size={15} color={Colors.onPrimaryContainer} />
                  <Text style={styles.metricText}>{current.windSpeed} km/h</Text>
                </View>
                <View style={styles.metric}>
                  <MaterialIcons name="thermostat" size={15} color={Colors.onPrimaryContainer} />
                  <Text style={styles.metricText}>Feels {current.feelsLike}°</Text>
                </View>
              </View>

              {isStale ? <Text style={styles.staleNote}>Showing the last saved reading</Text> : null}
            </>
          ) : (
            <View style={styles.weatherTop}>
              <View style={styles.weatherReading}>
                <Text style={styles.temperature}>--°</Text>
                <Text style={styles.condition}>Map a field to see local weather</Text>
              </View>
              <MaterialIcons name="wb-cloudy" size={56} color={Colors.onPrimaryContainer} />
            </View>
          )}
        </Card>

        <ForecastStrip forecast={forecast} loading={weatherLoading} />

        {fieldsLoading ? (
          <View style={styles.loadingBlock}>
            <Skeleton height={132} radius={Shape.large} />
            <Skeleton height={92} radius={Shape.large} />
          </View>
        ) : !hasFields ? (
          <EmptyState
            icon="agriculture"
            title="No fields mapped yet"
            description="Walk your boundary once and Agronavis can watch the weather, soil and market for that exact plot."
            actionLabel="Map your first field"
            onAction={() => router.push('/(tabs)/farm' as never)}
          />
        ) : (
          <>
            <AdvisoryCard
              advisory={topUnread}
              unreadCount={unreadCount}
              loading={advisoryLoading}
              onMarkRead={(id) => markRead.mutate(id)}
            />

            {fields!.length > 1 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.fieldRow}
              >
                {fields!.map((field) => {
                  const selected = field.id === activeFieldId;
                  return (
                    <Pressable
                      key={field.id}
                      onPress={() => setActiveField(field.id, field.farmId)}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[styles.fieldChip, selected && styles.fieldChipSelected]}
                    >
                      <Text style={[styles.fieldName, selected && styles.fieldNameSelected]}>
                        {field.name}
                      </Text>
                      <Text style={[styles.fieldArea, selected && styles.fieldAreaSelected]}>
                        {field.areaAcres.toFixed(2)} acres
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}

            <Surface level={1} style={styles.soilCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Soil nutrients</Text>
                {activeField ? (
                  <Text style={styles.sectionMeta}>{activeField.name}</Text>
                ) : null}
              </View>

              {soilLoading ? (
                <View style={styles.nutrientRow}>
                  <Skeleton height={66} radius={Shape.medium} />
                  <Skeleton height={66} radius={Shape.medium} />
                  <Skeleton height={66} radius={Shape.medium} />
                </View>
              ) : (
                <View style={styles.nutrientRow}>
                  <NutrientTile label="Nitrogen" level={levels.nitrogen} />
                  <NutrientTile label="Phosphorus" level={levels.phosphorus} />
                  <NutrientTile label="Potassium" level={levels.potassium} />
                </View>
              )}

              {isRegional && !soilLoading ? (
                <View style={styles.note}>
                  <MaterialIcons name="info-outline" size={14} color={Colors.onSurfaceVariant} />
                  <Text style={styles.noteText}>
                    District averages. Add a soil test for figures from your own plot.
                  </Text>
                </View>
              ) : null}
            </Surface>

            <MarketPrices
              prices={prices ?? []}
              loading={pricesLoading}
              live={socket.connected}
              onPressCommodity={() => router.push('/crops' as never)}
            />

            <View style={styles.tasksSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Tasks</Text>
                {tasks?.length ? <Text style={styles.sectionMeta}>{tasks.length} open</Text> : null}
              </View>

              {tasksLoading ? (
                <View style={styles.loadingBlock}>
                  <Skeleton height={72} radius={Shape.large} />
                  <Skeleton height={72} radius={Shape.large} />
                </View>
              ) : tasks?.length ? (
                <View style={styles.taskList}>
                  {tasks.slice(0, 5).map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onComplete={() => completeTask.mutate(task.id)}
                    />
                  ))}
                </View>
              ) : (
                <Card variant="outlined" style={styles.noTasks}>
                  <MaterialIcons name="task-alt" size={20} color={Colors.primary} />
                  <Text style={styles.noTasksText}>Everything on your list is done.</Text>
                </Card>
              )}
            </View>

            <Button
              label="Scan a crop for disease"
              icon="photo-camera"
              variant="tonal"
              fullWidth
              onPress={() => router.push('/(tabs)/scan' as never)}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },

  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
  },
  avatar: { width: 40, height: 40, borderRadius: Shape.full },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: Shape.full,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { ...Type.titleMedium, color: Colors.onPrimaryContainer },
  appBarTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  wordmark: { ...Type.titleLarge, color: Colors.onSurface },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: Shape.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationCount: { ...Type.labelSmall, fontSize: 10, color: Colors.onError },

  scroll: { paddingHorizontal: Spacing.lg, gap: Spacing.xl },
  greeting: { gap: 2 },
  greetingText: { ...Type.headlineSmall, color: Colors.onSurface },
  greetingDate: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },

  weatherCard: {
    backgroundColor: Colors.primaryContainer,
    padding: Spacing.xl,
    gap: Spacing.lg,
    ...Elevation.level1,
  },
  weatherLoading: { gap: Spacing.sm },
  weatherTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weatherReading: { flex: 1, gap: 2 },
  temperature: { ...Type.displaySmall, color: Colors.onPrimaryContainer, fontWeight: '500' },
  condition: {
    ...Type.bodyLarge,
    color: Colors.onPrimaryContainer,
    textTransform: 'capitalize',
    opacity: 0.85,
  },
  weatherMetrics: { flexDirection: 'row', gap: Spacing.xl },
  metric: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  metricText: { ...Type.labelLarge, color: Colors.onPrimaryContainer },
  staleNote: { ...Type.bodySmall, color: Colors.onPrimaryContainer, opacity: 0.7 },

  loadingBlock: { gap: Spacing.md },

  fieldRow: { flexDirection: 'row', gap: Spacing.sm, paddingRight: Spacing.lg },
  fieldChip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Shape.medium,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    gap: 2,
  },
  fieldChipSelected: { backgroundColor: Colors.secondaryContainer, borderColor: 'transparent' },
  fieldName: { ...Type.labelLarge, color: Colors.onSurfaceVariant },
  fieldNameSelected: { color: Colors.onSecondaryContainer },
  fieldArea: { ...Type.bodySmall, color: Colors.outline },
  fieldAreaSelected: { color: Colors.onSecondaryContainer, opacity: 0.75 },

  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  sectionTitle: { ...Type.titleMedium, color: Colors.onSurface, flex: 1 },
  sectionMeta: { ...Type.bodySmall, color: Colors.onSurfaceVariant },

  soilCard: { padding: Spacing.lg, gap: Spacing.md },
  nutrientRow: { flexDirection: 'row', gap: Spacing.sm },
  nutrient: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Shape.medium,
    alignItems: 'center',
    gap: 2,
  },
  nutrientValue: { ...Type.titleMedium },
  nutrientLabel: { ...Type.labelSmall, opacity: 0.8 },
  note: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  noteText: { ...Type.bodySmall, color: Colors.onSurfaceVariant, flex: 1 },

  tasksSection: { gap: Spacing.md },
  taskList: { gap: Spacing.sm },
  task: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: Spacing.md },
  taskIcon: {
    width: 40,
    height: 40,
    borderRadius: Shape.medium,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskBody: { flex: 1, gap: 2 },
  taskTitle: { ...Type.titleSmall, color: Colors.onSurface },
  taskDue: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  taskDone: {
    width: 36,
    height: 36,
    borderRadius: Shape.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noTasks: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.lg },
  noTasksText: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
});
