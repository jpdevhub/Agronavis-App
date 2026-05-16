import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

const AVATAR_URL = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80';
const FARM_URL   = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80';

function StatChip({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={[styles.statChip, { backgroundColor: color }]}>
      <Text style={styles.statChipValue}>{value}</Text>
      <Text style={styles.statChipLabel}>{label}</Text>
    </View>
  );
}

function TaskCard({
  tag, tagColor, title, desc, due,
}: { tag: string; tagColor: string; title: string; desc: string; due: string }) {
  return (
    <View style={styles.taskCard}>
      <View style={styles.taskCardLeft}>
        <View style={[styles.taskTag, { backgroundColor: tagColor }]}>
          <Text style={styles.taskTagText}>{tag}</Text>
        </View>
        <Text style={styles.taskTitle}>{title}</Text>
        <Text style={styles.taskDesc}>{desc}</Text>
        <Text style={styles.taskDue}>{due}</Text>
      </View>
      <TouchableOpacity style={styles.taskDoneBtn} activeOpacity={0.8}>
        <MaterialIcons name="check" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.push('/profile' as any)} activeOpacity={0.85}>
          <Image source={{ uri: AVATAR_URL }} style={styles.avatar} />
        </TouchableOpacity>
        <Text style={styles.logo}>Agronavis</Text>
        <TouchableOpacity style={styles.notifBtn} activeOpacity={0.8}>
          <MaterialIcons name="notifications-none" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting + Weather */}
        <View style={styles.greetRow}>
          <View style={styles.greetLeft}>
            <Text style={styles.greetName}>Hello, Rajesh 👋</Text>
            <Text style={styles.greetDate}>Thursday, 24 October 2024</Text>
          </View>
          <View style={styles.weatherCard}>
            <View>
              <Text style={styles.weatherTitle}>WEATHER</Text>
              <Text style={styles.weatherTemp}>28°C</Text>
              <Text style={styles.weatherCond}>Sunny</Text>
            </View>
            <MaterialIcons name="wb-sunny" size={44} color={Colors.tertiaryContainer} />
          </View>
        </View>

        {/* Crop Status */}
        <View style={styles.bentoRow}>
          {/* Crop progress */}
          <View style={styles.cropCard}>
            <View style={styles.cropCardTop}>
              <View>
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active Growth</Text>
                </View>
                <Text style={styles.cropName}>Wheat (HD 2967)</Text>
                <Text style={styles.cropDay}>Day 45 of 120</Text>
              </View>
              <MaterialIcons name="agriculture" size={28} color={Colors.primary} />
            </View>
            <View style={styles.progressTrack}>
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: '37.5%' }]}
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.pLabel}>Seeding</Text>
              <Text style={[styles.pLabel, { color: Colors.primary }]}>Tillering ●</Text>
              <Text style={styles.pLabel}>Harvest</Text>
            </View>
          </View>

          {/* Soil moisture */}
          <View style={styles.soilCard}>
            <View style={styles.moistureCircle}>
              <Text style={styles.moistureValue}>64%</Text>
            </View>
            <View style={styles.soilInfo}>
              <Text style={styles.soilTitle}>Soil Moisture</Text>
              <Text style={styles.soilDesc}>
                Level is optimal. Next irrigation in 48h.
              </Text>
              <View style={styles.soilIcons}>
                <MaterialIcons name="water-drop" size={20} color={Colors.primaryContainer} />
                <MaterialIcons name="opacity"    size={20} color={Colors.primaryContainer} />
              </View>
            </View>
          </View>
        </View>

        {/* NPK Stats */}
        <View style={styles.statRow}>
          <StatChip label="Nitrogen" value="Medium" color={Colors.tertiaryFixed} />
          <StatChip label="Phosphorus" value="Low" color={Colors.errorContainer} />
          <StatChip label="Potassium" value="High" color={Colors.secondaryContainer} />
        </View>

        {/* Select Crops CTA */}
        <TouchableOpacity
          onPress={() => router.push('/crops')}
          activeOpacity={0.88}
          style={styles.cropsCta}
        >
          <LinearGradient
            colors={[Colors.primaryFixed, Colors.secondaryContainer]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.cropsCtaGrad}
          >
            <View style={styles.cropsCtaLeft}>
              <MaterialIcons name="eco" size={24} color={Colors.primary} />
              <View>
                <Text style={styles.cropsCtaTitle}>Select Your Crops</Text>
                <Text style={styles.cropsCtaSub}>Customize your dashboard</Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward" size={20} color={Colors.primary} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Aerial Monitoring */}
        <TouchableOpacity
          style={styles.aerialCard}
          onPress={() => router.push('/(tabs)/farm')}
          activeOpacity={0.9}
        >
          <Image source={{ uri: FARM_URL }} style={styles.aerialImage} resizeMode="cover" />
          <LinearGradient
            colors={['transparent', 'rgba(11,28,48,0.75)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.aerialLiveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>LIVE SATELLITE FEED</Text>
          </View>
          <View style={styles.aerialBottom}>
            <Text style={styles.aerialTitle}>Northern Plains Monitoring</Text>
            <Text style={styles.aerialSub}>All systems online • 4m ago</Text>
          </View>
          <View style={styles.aerialFullBtn}>
            <MaterialIcons name="fullscreen" size={26} color={Colors.onSurface} />
          </View>
        </TouchableOpacity>

        {/* Tasks */}
        <Text style={styles.sectionTitle}>
          <MaterialIcons name="event-note" size={18} color={Colors.onSurface} />
          {'  '}UPCOMING TASKS
        </Text>
        <TaskCard
          tag="DUE TODAY"
          tagColor={Colors.errorContainer}
          title="Apply First Dose of Fertilizer"
          desc="Apply 2.5 bags of Urea to the 2-acre plot."
          due="Field Sector B"
        />
        <View style={styles.taskMiniRow}>
          <View style={styles.taskMini}>
            <View style={styles.taskMiniIcon}>
              <MaterialIcons name="bug-report" size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.taskMiniSub}>Tomorrow</Text>
              <Text style={styles.taskMiniTitle}>Pest Inspection: Sector A</Text>
            </View>
          </View>
          <View style={styles.taskMini}>
            <View style={[styles.taskMiniIcon, { backgroundColor: Colors.tertiaryFixed }]}>
              <MaterialIcons name="cloud-sync" size={22} color={Colors.tertiary} />
            </View>
            <View>
              <Text style={styles.taskMiniSub}>Oct 26</Text>
              <Text style={styles.taskMiniTitle}>Weather Calibration Scan</Text>
            </View>
          </View>
        </View>

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

  // Greeting
  greetRow:      { flexDirection: 'row', gap: 12, alignItems: 'center' },
  greetLeft:     { flex: 1 },
  greetName:     { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: Colors.onSurface },
  greetDate:     { fontSize: 14, color: Colors.onSurfaceVariant, marginTop: 2 },
  weatherCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surfaceContainerHigh, borderRadius: Radii.xl,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  weatherTitle:  { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: Colors.onSurfaceVariant },
  weatherTemp:   { fontSize: 26, fontWeight: '900', color: Colors.onSurface },
  weatherCond:   { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },

  // Bento
  bentoRow:      { gap: 12 },
  cropCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xxl,
    padding: 20, gap: 14,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04, shadowRadius: 16, elevation: 3,
  },
  cropCardTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  activeBadge: {
    alignSelf: 'flex-start', backgroundColor: Colors.secondaryContainer,
    borderRadius: Radii.full, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 6,
  },
  activeBadgeText: { fontSize: 11, fontWeight: '800', color: Colors.onSecondaryContainer, letterSpacing: 0.5 },
  cropName:      { fontSize: 20, fontWeight: '700', color: Colors.onSurface },
  cropDay:       { fontSize: 13, color: Colors.onSurfaceVariant, marginTop: 2 },
  progressTrack: { height: 10, backgroundColor: Colors.surfaceContainerHighest, borderRadius: 5, overflow: 'hidden' },
  progressFill:  { height: '100%', borderRadius: 5 },
  progressLabels:{ flexDirection: 'row', justifyContent: 'space-between' },
  pLabel:        { fontSize: 10, fontWeight: '700', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.3 },

  soilCard: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Radii.xxl,
    padding: 20, flexDirection: 'row', alignItems: 'center', gap: 16,
  },
  moistureCircle: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 8, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  moistureValue: { fontSize: 18, fontWeight: '900', color: Colors.primary },
  soilInfo:      { flex: 1, gap: 4 },
  soilTitle:     { fontSize: 16, fontWeight: '800', color: Colors.onSurface },
  soilDesc:      { fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 18 },
  soilIcons:     { flexDirection: 'row', gap: 4, marginTop: 4 },

  // Stats
  statRow:       { flexDirection: 'row', gap: 8 },
  statChip:      { flex: 1, borderRadius: Radii.lg, paddingVertical: 10, paddingHorizontal: 12, alignItems: 'center', gap: 2 },
  statChipValue: { fontSize: 13, fontWeight: '800', color: Colors.onSurface },
  statChipLabel: { fontSize: 10, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Crops CTA
  cropsCta:      { borderRadius: Radii.xl, overflow: 'hidden' },
  cropsCtaGrad: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  cropsCtaLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cropsCtaTitle: { fontSize: 16, fontWeight: '800', color: Colors.onSurface },
  cropsCtaSub:   { fontSize: 12, color: Colors.onSurfaceVariant },

  // Aerial
  aerialCard: {
    height: 220, borderRadius: Radii.xxl, overflow: 'hidden',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
  },
  aerialImage:   { width: '100%', height: '100%' },
  aerialLiveBadge: {
    position: 'absolute', top: 16, left: 16,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
  },
  liveDot:       { width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' },
  liveBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5, color: '#fff' },
  aerialBottom:  { position: 'absolute', bottom: 16, left: 16 },
  aerialTitle:   { fontSize: 20, fontWeight: '900', color: '#fff', letterSpacing: -0.4 },
  aerialSub:     { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  aerialFullBtn: {
    position: 'absolute', bottom: 14, right: 14,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },

  // Tasks
  sectionTitle:  { fontSize: 14, fontWeight: '900', letterSpacing: 1.2, color: Colors.onSurface, textTransform: 'uppercase', marginTop: 4 },
  taskCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xxl,
    padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05, shadowRadius: 16, elevation: 3,
  },
  taskCardLeft:  { flex: 1, gap: 6 },
  taskTag:       { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  taskTagText:   { fontSize: 10, fontWeight: '900', color: Colors.onErrorContainer, letterSpacing: 0.5 },
  taskTitle:     { fontSize: 16, fontWeight: '700', color: Colors.onSurface },
  taskDesc:      { fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 18 },
  taskDue:       { fontSize: 12, color: Colors.outline, fontStyle: 'italic' },
  taskDoneBtn: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  taskMiniRow:   { flexDirection: 'row', gap: 10 },
  taskMini: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Radii.xl, padding: 14,
  },
  taskMiniIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center',
  },
  taskMiniSub:   { fontSize: 11, color: Colors.outline, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  taskMiniTitle: { fontSize: 13, fontWeight: '700', color: Colors.onSurface, marginTop: 2 },
});
