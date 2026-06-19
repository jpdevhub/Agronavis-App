import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';
import { useFarmer } from '@/hooks/useFarmer';
import { useFarmFields } from '@/hooks/useFarmFields';
import { useTimelineTasks, FarmTask } from '@/hooks/useTimelineTasks';
import { useWeather } from '@/hooks/useWeather';
import { useSoilHealth } from '@/hooks/useSoilHealth';
import { useFarmStore } from '@/store/useFarmStore';

const FARM_URL = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80';

// ── Skeleton placeholder ──────────────────────────────────────────────────────
function Skeleton({ width, height, borderRadius = 8 }: { width: number | string; height: number; borderRadius?: number }) {
  return (
    <View style={[styles.skeleton, { width: width as number, height, borderRadius }]} />
  );
}

// ── NPK Chip ──────────────────────────────────────────────────────────────────
const NPK_COLORS: Record<string, { bg: string; text: string }> = {
  High:   { bg: Colors.secondaryContainer, text: Colors.onSecondaryContainer },
  Medium: { bg: Colors.tertiaryFixed,      text: Colors.onTertiaryContainer  },
  Low:    { bg: Colors.errorContainer,     text: Colors.onErrorContainer     },
  'N/A':  { bg: Colors.surfaceContainerHigh, text: Colors.onSurfaceVariant  },
};

function StatChip({ label, value }: { label: string; value: string }) {
  const colors = NPK_COLORS[value] ?? NPK_COLORS['N/A'];
  return (
    <View style={[styles.statChip, { backgroundColor: colors.bg }]}>
      <Text style={[styles.statChipValue, { color: colors.text }]}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}

// ── Task card ─────────────────────────────────────────────────────────────────
const TASK_TYPE_META: Record<string, { icon: any; color: string }> = {
  fertilizer_application: { icon: 'science',    color: Colors.tertiaryFixed },
  pest_scan:              { icon: 'bug-report',  color: Colors.errorContainer },
  irrigation:             { icon: 'water-drop',  color: Colors.primaryFixed },
  sowing:                 { icon: 'agriculture', color: Colors.secondaryContainer },
  harvesting:             { icon: 'grass',       color: Colors.secondaryContainer },
  soil_prep:              { icon: 'terrain',     color: Colors.surfaceContainerHigh },
  market_prep:            { icon: 'store',       color: Colors.primaryFixed },
};

function isOverdue(task: FarmTask): boolean {
  return task.status === 'overdue';
}

function isDueToday(task: FarmTask): boolean {
  const today = new Date().toISOString().split('T')[0];
  return task.due_date === today && task.status !== 'overdue';
}

function TaskCard({ task, onComplete }: { task: FarmTask; onComplete: () => void }) {
  const meta = TASK_TYPE_META[task.task_type ?? ''] ?? { icon: 'event-note', color: Colors.surfaceContainerHigh };
  const overdue = isOverdue(task);
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
          Due {new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-IN', {
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

// ── Weather icon map ──────────────────────────────────────────────────────────
function weatherIcon(icon: string): React.ComponentProps<typeof MaterialIcons>['name'] {
  if (icon.startsWith('01')) return 'wb-sunny';
  if (icon.startsWith('02') || icon.startsWith('03')) return 'cloud';
  if (icon.startsWith('04')) return 'cloud';
  if (icon.startsWith('09') || icon.startsWith('10')) return 'grain';
  if (icon.startsWith('11')) return 'flash-on';
  if (icon.startsWith('13')) return 'ac-unit';
  return 'wb-cloudy';
}

// ── Empty state ───────────────────────────────────────────────────────────────
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
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.emptyBtnGrad}
        >
          <MaterialIcons name="add-location-alt" size={20} color="#fff" />
          <Text style={styles.emptyBtnText}>Add Your First Farm</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const { activeFieldId } = useFarmStore();

  const { data: farmer,  isLoading: farmerLoading }  = useFarmer();
  const { data: fields,  isLoading: fieldsLoading }  = useFarmFields();
  const { data: tasks,   isLoading: tasksLoading, completeTask } = useTimelineTasks();
  const { npk, isLoading: soilLoading, isRegional } = useSoilHealth();

  // Get coordinates from the active field for weather
  const activeField = fields?.find((f) => f.id === activeFieldId);
  const { data: weather, isLoading: weatherLoading } = useWeather(
    activeField?.center_latitude,
    activeField?.center_longitude,
  );

  const hasFields = fields && fields.length > 0;
  const greeting  = farmer?.full_name ? `Hello, ${farmer.full_name.split(' ')[0]} 👋` : 'Hello 👋';

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const avatarUri = farmer?.avatar_url
    ? farmer.avatar_url
    : `https://api.dicebear.com/7.x/personas/png?seed=${encodeURIComponent(farmer?.full_name ?? 'farmer')}&size=200`;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/profile' as any)} activeOpacity={0.85}>
          {farmerLoading
            ? <Skeleton width={40} height={40} borderRadius={20} />
            : <Image source={{ uri: avatarUri }} style={styles.avatar} />
          }
        </TouchableOpacity>
        <Text style={styles.logo}>Agronavis</Text>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
          <MaterialIcons name="notifications-none" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Greeting + Weather */}
        <View style={styles.greetRow}>
          <View style={styles.greetLeft}>
            {farmerLoading
              ? <Skeleton width={200} height={28} borderRadius={8} />
              : <Text style={styles.greetName}>{greeting}</Text>
            }
            <Text style={styles.greetDate}>{today}</Text>
          </View>

          {/* Weather chip */}
          <View style={styles.weatherCard}>
            {weatherLoading || !weather ? (
              <View style={{ gap: 4 }}>
                <Skeleton width={60} height={28} />
                <Skeleton width={50} height={14} />
              </View>
            ) : (
              <>
                <View>
                  <Text style={styles.weatherTitle}>WEATHER</Text>
                  <Text style={styles.weatherTemp}>{weather.temp}°C</Text>
                  <Text style={styles.weatherCond} numberOfLines={1}>
                    {weather.description}
                  </Text>
                </View>
                <MaterialIcons
                  name={weatherIcon(weather.icon)}
                  size={40}
                  color={Colors.tertiaryContainer}
                />
              </>
            )}
            {!weather && !weatherLoading && (
              <>
                <View>
                  <Text style={styles.weatherTitle}>WEATHER</Text>
                  <Text style={styles.weatherTemp}>--°C</Text>
                  <Text style={styles.weatherCond}>Add a field to see weather</Text>
                </View>
                <MaterialIcons name="wb-cloudy" size={40} color={Colors.outline} />
              </>
            )}
          </View>
        </View>

        {/* Empty State or Field Content */}
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
            {/* Field selector (if multiple fields) */}
            {fields.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.fieldScroll}>
                {fields.map((f) => (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.fieldChip, f.id === activeFieldId && styles.fieldChipActive]}
                    onPress={() => useFarmStore.getState().setActiveField(f.id, f.farm_id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.fieldChipText, f.id === activeFieldId && styles.fieldChipTextActive]}>
                      {f.name}
                    </Text>
                    <Text style={styles.fieldChipArea}>{f.area_acres} acres</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* NPK Stats */}
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
                    <StatChip label="Nitrogen"   value={npk.nitrogen}   />
                    <StatChip label="Phosphorus" value={npk.phosphorus} />
                    <StatChip label="Potassium"  value={npk.potassium}  />
                  </>
                )}
              </View>
              {isRegional && !soilLoading && (
                <View style={styles.regionalBadge}>
                  <MaterialIcons name="info-outline" size={13} color={Colors.primary} />
                  <Text style={styles.regionalText}>District baseline — add a soil test for precise data</Text>
                </View>
              )}
            </View>

            {/* Active Field info card */}
            {activeField && (
              <View style={styles.fieldInfoCard}>
                <View style={styles.fieldInfoLeft}>
                  <Text style={styles.fieldInfoName}>{activeField.name}</Text>
                  <Text style={styles.fieldInfoArea}>{activeField.area_acres} acres</Text>
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

            {/* Tasks Section */}
            <Text style={styles.sectionTitle}>
              <MaterialIcons name="event-note" size={18} color={Colors.onSurface} />
              {'  '}UPCOMING TASKS
            </Text>

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
                <MaterialIcons name="check-circle-outline" size={36} color={Colors.primary} />
                <Text style={styles.noTasksText}>All tasks completed! 🎉</Text>
                <Text style={styles.noTasksSub}>New tasks appear when you add crops.</Text>
              </View>
            )}
          </>
        )}

        {/* Aerial Monitoring — always visible */}
        <TouchableOpacity
          style={styles.aerialCard}
          onPress={() => router.push('/(tabs)/farm' as any)}
          activeOpacity={0.9}
        >
          <Image source={{ uri: FARM_URL }} style={styles.aerialImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(11,28,48,0.75)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.aerialLiveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>SATELLITE VIEW</Text>
          </View>
          <View style={styles.aerialBottom}>
            <Text style={styles.aerialTitle}>Farm Monitoring</Text>
            <Text style={styles.aerialSub}>Open farm map →</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.surface },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: 'rgba(248,249,255,0.92)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 8,
  },
  avatar:        { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.primaryFixed },
  logo:          { fontSize: 24, fontWeight: '900', letterSpacing: -0.8, color: Colors.primary },
  notifBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scroll:        { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  skeleton:      { backgroundColor: Colors.surfaceContainerHigh },

  // Greeting
  greetRow:      { flexDirection: 'row', gap: 12, alignItems: 'center' },
  greetLeft:     { flex: 1, gap: 4 },
  greetName:     { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: Colors.onSurface },
  greetDate:     { fontSize: 13, color: Colors.onSurfaceVariant },
  weatherCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceContainerHigh, borderRadius: Radii.xl,
    paddingHorizontal: 14, paddingVertical: 12, minWidth: 140,
  },
  weatherTitle:  { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.onSurfaceVariant },
  weatherTemp:   { fontSize: 24, fontWeight: '900', color: Colors.onSurface },
  weatherCond:   { fontSize: 12, fontWeight: '600', color: Colors.onSurfaceVariant, maxWidth: 80 },

  // Field selector
  fieldScroll:   { marginHorizontal: -4 },
  fieldChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radii.xl,
    backgroundColor: Colors.surfaceContainerHigh, marginHorizontal: 4, alignItems: 'center',
  },
  fieldChipActive:    { backgroundColor: Colors.primary },
  fieldChipText:      { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  fieldChipTextActive:{ color: '#fff' },
  fieldChipArea:      { fontSize: 11, color: Colors.onSurfaceVariant, marginTop: 2 },

  // NPK stats
  statRow:       { flexDirection: 'row', gap: 8 },
  statChip:      { flex: 1, borderRadius: Radii.lg, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', gap: 2 },
  statChipValue: { fontSize: 13, fontWeight: '800' },
  statChipLabel: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Field info card
  fieldInfoCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xl,
    padding: 16,
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
  sectionTitle:  { fontSize: 13, fontWeight: '900', letterSpacing: 1.2, color: Colors.onSurface, textTransform: 'uppercase', marginTop: 4 },
  taskCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xxl,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 16, elevation: 3,
  },
  taskIconWrap: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  taskCardLeft:  { flex: 1, gap: 4 },
  taskTag:       { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  taskTagText:   { fontSize: 10, fontWeight: '900', color: Colors.onErrorContainer, letterSpacing: 0.5 },
  taskTitle:     { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  taskDesc:      { fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 18 },
  taskDue:       { fontSize: 12, color: Colors.outline, fontStyle: 'italic' },
  taskDoneBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  // No tasks
  noTasksBox: {
    alignItems: 'center', gap: 8, paddingVertical: 32,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xxl,
  },
  noTasksText:  { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  noTasksSub:   { fontSize: 13, color: Colors.onSurfaceVariant },

  // Aerial
  aerialCard: {
    height: 200, borderRadius: Radii.xxl, overflow: 'hidden',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
  },
  aerialImage:      { width: '100%', height: '100%' },
  aerialLiveBadge: {
    position: 'absolute', top: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  liveDot:          { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22c55e' },
  liveBadgeText:    { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#fff' },
  aerialBottom:     { position: 'absolute', bottom: 16, left: 16 },
  aerialTitle:      { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  aerialSub:        { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  // Empty state
  emptyWrap: {
    alignItems: 'center', gap: 12, paddingVertical: 32,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xxl, padding: 24,
  },
  emptyIcon: {
    width: 88, height: 88, borderRadius: Radii.xl,
    backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle:    { fontSize: 22, fontWeight: '800', color: Colors.onSurface },
  emptyDesc: {
    fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center',
    lineHeight: 20, maxWidth: 280,
  },
  emptyBtn:      { width: '100%', borderRadius: Radii.xl, overflow: 'hidden', marginTop: 4 },
  emptyBtnGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 52, gap: 8,
  },
  emptyBtnText:  { fontSize: 16, fontWeight: '700', color: '#fff' },
});
