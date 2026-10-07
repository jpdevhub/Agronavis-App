import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image, RefreshControl,
} from 'react-native';
import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import type { FarmTask } from '@agronavis/shared-types';
import { Colors, Radii, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { useTabBarHeight } from '@/hooks/useTabBarHeight';
import { useFarmer } from '@/hooks/useFarmer';
import { useFarmFields } from '@/hooks/useFarmFields';
import { useTimelineTasks } from '@/hooks/useTimelineTasks';
import { useWeather } from '@/hooks/useWeather';
import { useSoilHealth } from '@/hooks/useSoilHealth';
import { useFarmStore } from '@/store/useFarmStore';

function Skeleton({ width, height, borderRadius = 8 }: { width: number | string; height: number; borderRadius?: number }) {
  return (
    <View style={[styles.skeleton, { width: width as number, height, borderRadius }]} />
  );
}

const NPK_COLORS: Record<string, { bg: string; text: string }> = {
  High:   { bg: Colors.secondaryContainer, text: Colors.onSecondaryContainer },
  Medium: { bg: Colors.tertiaryFixed,      text: Colors.onTertiaryContainer  },
  Low:    { bg: Colors.errorContainer,     text: Colors.onErrorContainer     },
  'N/A':  { bg: Colors.surfaceContainerHigh, text: Colors.onSurfaceVariant  },
};

function StatChip({ label, value, onPress }: { label: string; value: string; onPress?: () => void }) {
  const colors = NPK_COLORS[value] ?? NPK_COLORS['N/A'];
  const body = (
    <>
      <Text style={[styles.statChipValue, { color: colors.text }]}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </>
  );

  // One word hides the distribution behind it; the report shows the spread.
  if (!onPress) {
    return <View style={[styles.statChip, { backgroundColor: colors.bg }]}>{body}</View>;
  }

  return (
    <TouchableOpacity
      style={[styles.statChip, { backgroundColor: colors.bg }]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`${label} ${value}. Open the soil health report.`}
    >
      {body}
    </TouchableOpacity>
  );
}

const TASK_TYPE_META: Record<string, { icon: React.ComponentProps<typeof MaterialIcons>['name']; color: string }> = {
  fertilizer_application: { icon: 'science',    color: Colors.tertiaryFixed },
  pest_scan:              { icon: 'bug-report',  color: Colors.errorContainer },
  irrigation:             { icon: 'water-drop',  color: Colors.primaryFixed },
  sowing:                 { icon: 'agriculture', color: Colors.secondaryContainer },
  harvesting:             { icon: 'grass',       color: Colors.secondaryContainer },
  soil_prep:              { icon: 'terrain',     color: Colors.surfaceContainerHigh },
  market_prep:            { icon: 'store',       color: Colors.primaryFixed },
};

function isDueToday(task: FarmTask): boolean {
  const today = new Date().toISOString().split('T')[0];
  return task.dueDate === today && task.status !== 'overdue';
}

function TaskCard({ task, onComplete }: { task: FarmTask; onComplete: () => void }) {
  const meta = TASK_TYPE_META[task.taskType ?? ''] ?? { icon: 'event-note' as const, color: Colors.surfaceContainerHigh };
  const overdue = task.status === 'overdue';
  const today   = isDueToday(task);

  return (
    <View style={styles.taskCard}>
      <View style={[styles.taskIconWrap, { backgroundColor: meta.color }]}>
        <MaterialIcons name={meta.icon} size={22} color={Colors.primary} />
      </View>
      <View style={styles.taskCardLeft}>
        {(overdue || today) && (
          <View style={[styles.taskTag, { backgroundColor: overdue ? Colors.errorContainer : Colors.tertiaryFixed }]}>
            <Text style={styles.taskTagText}>{overdue ? 'OVERDUE' : 'DUE TODAY'}</Text>
          </View>
        )}
        <Text style={styles.taskTitle}>{task.title}</Text>
        {task.description ? (
          <Text style={styles.taskDesc} numberOfLines={2}>{task.description}</Text>
        ) : null}
        <Text style={styles.taskDue}>
          Due {new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short',
          })}
        </Text>
      </View>
      <TouchableOpacity style={styles.taskDoneBtn} onPress={onComplete} activeOpacity={0.8}>
        <MaterialIcons name="check" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function weatherIcon(icon: string): React.ComponentProps<typeof MaterialIcons>['name'] {
  if (icon.startsWith('01')) return 'wb-sunny';
  if (icon.startsWith('02') || icon.startsWith('03')) return 'cloud';
  if (icon.startsWith('04')) return 'cloud';
  if (icon.startsWith('09') || icon.startsWith('10')) return 'grain';
  if (icon.startsWith('11')) return 'flash-on';
  if (icon.startsWith('13')) return 'ac-unit';
  return 'wb-cloudy';
}

function EmptyFarmState({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyIcon}>
        <MaterialIcons name="agriculture" size={48} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>No Fields Yet</Text>
      <Text style={styles.emptyDesc}>
        Add your first farm plot to see tasks, soil health, and weather — all in one place.
      </Text>
      <TouchableOpacity onPress={onPress} style={styles.emptyBtn} activeOpacity={0.88}>
        <MaterialIcons name="add-location-alt" size={20} color="#fff" />
        <Text style={styles.emptyBtnText}>Add Your First Farm</Text>
      </TouchableOpacity>
    </View>
  );
}

function initialsOf(name: string | undefined): string {
  if (!name) return 'A';
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useTabBarHeight();
  const activeFieldId = useFarmStore((s) => s.activeFieldId);
  const activeFarmId  = useFarmStore((s) => s.activeFarmId);
  const setActiveField = useFarmStore((s) => s.setActiveField);

  const { data: farmer, isLoading: farmerLoading, refetch: refetchFarmer } = useFarmer();

  /**
   * The tiles show one word each — the rating that won. The report behind them
   * carries the distribution, the micronutrients and how many samples it rests
   * on.
   *
   * Keyed on the selected field's farm, not the farmer's profile: a farmer with
   * land in two states would otherwise read the same report for both, and it
   * would disagree with the weather, which follows the farm.
   */
  const openSoilReport = useCallback(() => {
    if (activeFieldId) {
      router.push({ pathname: '/soil-report', params: { fieldId: activeFieldId } } as never);
      return;
    }
    if (activeFarmId) {
      router.push({ pathname: '/soil-report', params: { farmId: activeFarmId } } as never);
      return;
    }
    if (!farmer?.state) return;
    router.push({
      pathname: '/soil-report',
      params: {
        state: farmer.state,
        ...(farmer.district ? { district: farmer.district } : {}),
      },
    } as never);
  }, [router, activeFieldId, activeFarmId, farmer?.state, farmer?.district]);
  const { data: fields, isLoading: fieldsLoading, refetch: refetchFields } = useFarmFields();
  const { data: tasks, isLoading: tasksLoading, completeTask, refetch: refetchTasks } = useTimelineTasks();
  const { levels, isLoading: soilLoading, isRegional, hasNoCoverage } = useSoilHealth();
  const { current: weather, isLoading: weatherLoading, refetch: refetchWeather } = useWeather(activeFarmId, activeFieldId);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchFarmer(), refetchFields(), refetchTasks(), refetchWeather()]);
    setRefreshing(false);
  }, [refetchFarmer, refetchFields, refetchTasks, refetchWeather]);

  const activeField = fields?.find((f) => f.id === activeFieldId);
  const hasFields = fields && fields.length > 0;
  const greeting  = farmer?.fullName ? `Hello, ${farmer.fullName.split(' ')[0]}` : 'Hello';

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.topBar, { paddingTop: insets.top + Spacing.md }]}>
        <TouchableOpacity onPress={() => router.push('/profile' as any)} activeOpacity={0.85}>
          {farmerLoading ? (
            <Skeleton width={40} height={40} borderRadius={20} />
          ) : farmer?.avatarUrl ? (
            <Image source={{ uri: farmer.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarInitials}>{initialsOf(farmer?.fullName)}</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.logo}>Agronavis</Text>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
          <MaterialIcons name="notifications-none" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: tabBarHeight + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >

        <View style={styles.greetRow}>
          <View style={styles.greetLeft}>
            {farmerLoading
              ? <Skeleton width={200} height={28} borderRadius={8} />
              : <Text style={styles.greetName}>{greeting}</Text>
            }
            <Text style={styles.greetDate}>{today}</Text>
          </View>

          <TouchableOpacity
            style={styles.weatherCard}
            onPress={() => router.push('/weather-report' as any)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Open the full weather record"
          >
            {weatherLoading ? (
              <View style={{ gap: 4 }}>
                <Skeleton width={60} height={28} />
                <Skeleton width={50} height={14} />
              </View>
            ) : weather ? (
              <>
                <View>
                  <Text style={styles.weatherTitle}>WEATHER</Text>
                  <Text style={styles.weatherTemp}>{Math.round(weather.temp)}°C</Text>
                  <Text style={styles.weatherCond} numberOfLines={1}>
                    {weather.description}
                  </Text>
                </View>
                <MaterialIcons
                  name={weatherIcon(weather.icon)}
                  size={40}
                  color={Colors.primary}
                />
              </>
            ) : (
              <>
                <View>
                  <Text style={styles.weatherTitle}>WEATHER</Text>
                  <Text style={styles.weatherTemp}>--°C</Text>
                  <Text style={styles.weatherCond}>Add a field to see weather</Text>
                </View>
                <MaterialIcons name="wb-cloudy" size={40} color={Colors.outline} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {fieldsLoading ? (
          <View style={{ gap: 12 }}>
            <Skeleton width="100%" height={140} borderRadius={Radii.xxl} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Skeleton width="32%" height={60} borderRadius={Radii.lg} />
              <Skeleton width="32%" height={60} borderRadius={Radii.lg} />
              <Skeleton width="32%" height={60} borderRadius={Radii.lg} />
            </View>
          </View>
        ) : !hasFields ? (
          <EmptyFarmState onPress={() => router.push('/(tabs)/farm' as any)} />
        ) : (
          <>
            {fields.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.fieldScroll}
                contentContainerStyle={styles.fieldScrollContent}
              >
                {fields.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.fieldChip, f.id === activeFieldId && styles.fieldChipActive]}
                    onPress={() => setActiveField(f.id, f.farmId)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.fieldChipText, f.id === activeFieldId && styles.fieldChipTextActive]}>
                      {f.name}
                    </Text>
                    <Text style={[styles.fieldChipArea, f.id === activeFieldId && styles.fieldChipAreaActive]}>
                      {f.areaAcres.toFixed(2)} acres
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={{ gap: 6 }}>
              <View style={styles.statRow}>
                {soilLoading ? (
                  <>
                    <Skeleton width="31%" height={60} borderRadius={Radii.lg} />
                    <Skeleton width="31%" height={60} borderRadius={Radii.lg} />
                    <Skeleton width="31%" height={60} borderRadius={Radii.lg} />
                  </>
                ) : (
                  <>
                    <StatChip label="Nitrogen"   value={levels.nitrogen}   onPress={openSoilReport} />
                    <StatChip label="Phosphorus" value={levels.phosphorus} onPress={openSoilReport} />
                    <StatChip label="Potassium"  value={levels.potassium}  onPress={openSoilReport} />
                  </>
                )}
              </View>
              {!soilLoading && (isRegional || hasNoCoverage) && (
                <View style={styles.regionalBadge}>
                  <MaterialIcons name="info-outline" size={13} color={Colors.primary} />
                  <Text style={styles.regionalText}>
                    {hasNoCoverage
                      ? 'No Soil Health Card data for your state yet — record a soil test to see nutrients.'
                      : 'District baseline — add a soil test for precise data'}
                  </Text>
                </View>
              )}
            </View>

            {activeField && (
              <View style={styles.fieldInfoCard}>
                <View style={styles.fieldInfoLeft}>
                  <Text style={styles.fieldInfoName}>{activeField.name}</Text>
                  <Text style={styles.fieldInfoArea}>{activeField.areaAcres.toFixed(2)} acres</Text>
                </View>
                <TouchableOpacity
                  style={styles.fieldInfoBtn}
                  onPress={() => router.push('/(tabs)/farm' as any)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons name="arrow-forward" size={18} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}

            <Text style={styles.sectionTitle}>UPCOMING TASKS</Text>

            {tasksLoading ? (
              <View style={{ gap: 12 }}>
                <Skeleton width="100%" height={100} borderRadius={Radii.xxl} />
                <Skeleton width="100%" height={100} borderRadius={Radii.xxl} />
              </View>
            ) : tasks && tasks.length > 0 ? (
              <View style={{ gap: 12 }}>
                {tasks.slice(0, 5).map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => completeTask.mutate(task.id)}
                  />
                ))}
              </View>
            ) : (
              <View style={styles.noTasksBox}>
                <MaterialIcons name="eco" size={36} color={Colors.primary} />
                <Text style={styles.noTasksText}>No crop on this field yet</Text>
                <Text style={styles.noTasksSub}>
                  Add what you are growing and the season&apos;s sowing, fertiliser, pest and
                  harvest dates are laid out for you.
                </Text>
                <TouchableOpacity
                  style={styles.addCropBtn}
                  onPress={() => router.push('/crops' as any)}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <MaterialIcons name="add" size={20} color={Colors.onPrimary} />
                  <Text style={styles.addCropText}>Add a crop</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        <TouchableOpacity
          style={styles.aerialCard}
          onPress={() => router.push('/(tabs)/farm' as any)}
          activeOpacity={0.9}
        >
          <View style={styles.aerialLiveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>SATELLITE VIEW</Text>
          </View>
          <View style={styles.aerialBottom}>
            <Text style={styles.aerialTitle}>Farm Monitoring</Text>
            <Text style={styles.aerialSub}>Open farm map</Text>
          </View>
          <MaterialIcons name="map" size={72} color="rgba(255,255,255,0.16)" style={styles.aerialGlyph} />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.surface },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
    backgroundColor: 'rgba(248,249,255,0.92)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 8,
  },
  avatar:        { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.primaryFixed },
  avatarFallback:{ backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  avatarInitials:{ fontSize: 15, fontWeight: '800', color: Colors.onPrimaryContainer },
  logo:          { ...TypeEmphasized.headlineSmall, color: Colors.primary },
  notifBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll:        { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, gap: Spacing.lg },
  skeleton:      { backgroundColor: Colors.surfaceContainerHigh },

  // Greeting
  greetRow:      { flexDirection: 'row', gap: Spacing.md, alignItems: 'stretch' },
  greetLeft:     { flex: 1, gap: Spacing.xs, justifyContent: 'center' },
  greetName:     { ...TypeEmphasized.headlineSmall, color: Colors.onSurface },
  greetDate:     { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  weatherCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Shape.extraLarge,
    borderWidth: 1, borderColor: Colors.outlineVariant,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    width: 168,
  },
  weatherTitle:  { ...Type.labelSmall, letterSpacing: 1.2, color: Colors.onSurfaceVariant },
  weatherTemp:   { ...TypeEmphasized.headlineSmall, color: Colors.onSurface },
  weatherCond:   { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, maxWidth: 80 },

  // Field selector
  fieldScroll:   { flexGrow: 0 },
  fieldScrollContent: { gap: Spacing.sm, paddingVertical: 2 },
  fieldChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderRadius: Shape.full,
    backgroundColor: Colors.surfaceContainerHigh, alignItems: 'center',
  },
  fieldChipActive:    { backgroundColor: Colors.primary },
  fieldChipText:      { ...TypeEmphasized.titleSmall, color: Colors.onSurface },
  fieldChipTextActive:{ color: Colors.onPrimary },
  fieldChipArea:      { ...Type.labelMedium, color: Colors.onSurfaceVariant, marginTop: 2 },
  fieldChipAreaActive:{ color: Colors.primaryFixed },

  // NPK stats
  statRow:       { flexDirection: 'row', gap: 8 },
  statChip:      { flex: 1, borderRadius: Shape.largeIncreased, paddingVertical: Spacing.md, paddingHorizontal: Spacing.md, alignItems: 'center', gap: 2 },
  statChipValue: { ...TypeEmphasized.titleSmall },
  statChipLabel: { ...Type.labelSmall, color: Colors.onSurfaceVariant, textTransform: 'uppercase' },

  // Field info card
  fieldInfoCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Shape.extraLarge,
    padding: Spacing.lg,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  fieldInfoLeft:  { gap: 2 },
  fieldInfoName:  { fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  fieldInfoArea:  { fontSize: 13, color: Colors.onSurfaceVariant },
  fieldInfoBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center',
  },
  regionalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryFixed, borderRadius: Radii.lg,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  regionalText: { fontSize: 12, color: Colors.onSurface, flex: 1, lineHeight: 16 },

  // Tasks
  sectionTitle:  { ...TypeEmphasized.titleSmall, color: Colors.onSurface, marginTop: Spacing.xs },
  taskCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Shape.extraLarge,
    padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 16, elevation: 3,
  },
  taskIconWrap: {
    width: 48, height: 48, borderRadius: Shape.large,
    alignItems: 'center', justifyContent: 'center',
  },
  taskCardLeft:  { flex: 1, gap: 4 },
  taskTag:       { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  taskTagText:   { fontSize: 10, fontWeight: '900', color: Colors.onErrorContainer, letterSpacing: 0.5 },
  taskTitle:     { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
  taskDesc:      { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  taskDue:       { fontSize: 12, color: Colors.outline, fontStyle: 'italic' },
  taskDoneBtn: {
    width: 44, height: 44, borderRadius: Shape.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  // No tasks
  addCropBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 48, paddingHorizontal: 22, marginTop: 6,
    borderRadius: Radii.full, backgroundColor: Colors.primary,
  },
  addCropText: { fontSize: 15, fontWeight: '800', color: Colors.onPrimary },
  noTasksBox: {
    alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Shape.extraLarge,
  },
  noTasksText:  { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  noTasksSub:   { fontSize: 13, color: Colors.onSurfaceVariant },

  // Farm monitoring
  aerialCard: {
    height: 160, borderRadius: Shape.extraLarge, overflow: 'hidden',
    backgroundColor: Colors.primary, justifyContent: 'flex-end', padding: 16,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
  },
  aerialGlyph:      { position: 'absolute', right: 12, bottom: 8 },
  aerialLiveBadge: {
    position: 'absolute', top: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  liveDot:          { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  liveBadgeText:    { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#fff' },
  aerialBottom:     { },
  aerialTitle:      { ...TypeEmphasized.titleLarge, color: '#fff' },
  aerialSub:        { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Empty state
  emptyWrap: {
    alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xxl,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Shape.extraLarge, padding: Spacing.xl,
  },
  emptyIcon: {
    width: 96, height: 96, borderRadius: Shape.extraExtraLarge,
    backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle:    { ...TypeEmphasized.headlineSmall, color: Colors.onSurface },
  emptyDesc: {
    fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center',
    lineHeight: 20, maxWidth: 280,
  },
  emptyBtn: {
    width: '100%', borderRadius: Shape.full, marginTop: Spacing.xs, height: 56,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.primary,
  },
  emptyBtnText:  { ...TypeEmphasized.titleMedium, color: Colors.onPrimary },
});
