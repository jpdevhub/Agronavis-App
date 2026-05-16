import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

const FARM_AERIAL = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80';
const HEATMAP_URL = 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=600&q=80';
const AVATAR_URL  = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80';

type SoilPill = { label: string; value: string; bg: string; textColor: string };
const SOIL_PILLS: SoilPill[] = [
  { label: 'N', value: 'Medium', bg: Colors.tertiaryFixed,      textColor: Colors.onTertiaryContainer },
  { label: 'P', value: 'Low',    bg: Colors.errorContainer,     textColor: Colors.onErrorContainer },
  { label: 'K', value: 'High',   bg: Colors.secondaryContainer, textColor: Colors.onSecondaryContainer },
];

export default function MyFarmsScreen() {
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
        <TouchableOpacity style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Sub-nav: Map | Fields | History | Settings */}
      <View style={styles.subNav}>
        {[
          { label: 'Map',      icon: 'map',              route: '/(tabs)/farm/map' },
          { label: 'Fields',   icon: 'layers',           route: '/(tabs)/farm/fields' },
          { label: 'History',  icon: 'history',          route: '/(tabs)/farm/history' },
          { label: 'Settings', icon: 'settings',         route: '/(tabs)/farm/settings' },
        ].map(({ label, icon, route }) => (
          <TouchableOpacity
            key={label}
            style={styles.subNavBtn}
            onPress={() => router.push(route as any)}
            activeOpacity={0.8}
          >
            <MaterialIcons name={icon as any} size={18} color={Colors.primary} />
            <Text style={styles.subNavLabel}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>My Farms</Text>
        <Text style={styles.pageSub}>Manage and monitor your active plots.</Text>

        {/* Main Farm Card */}
        <View style={styles.farmCard}>
          <View style={styles.farmImgWrap}>
            <Image source={{ uri: FARM_AERIAL }} style={styles.farmImg} resizeMode="cover" />
            <View style={styles.farmImgBadges}>
              <View style={styles.imgBadge}>
                <Text style={styles.imgBadgeText}>Active Yield</Text>
              </View>
              <View style={[styles.imgBadge, { backgroundColor: '#fff' }]}>
                <Text style={[styles.imgBadgeText, { color: Colors.onSurface }]}>2.5 Acres</Text>
              </View>
            </View>
          </View>
          <View style={styles.farmCardBody}>
            <View style={styles.farmCardHeader}>
              <View>
                <Text style={styles.farmName}>North Plot — 2.5 Acres</Text>
                <View style={styles.farmLocation}>
                  <MaterialIcons name="location-on" size={13} color={Colors.onSurfaceVariant} />
                  <Text style={styles.farmLocationText}>Sector 4G, Upper Basin</Text>
                </View>
              </View>
              <View style={styles.cropBadge}>
                <Text style={styles.cropBadgeText}>Corn Hybrid Z4</Text>
              </View>
            </View>

            {/* Soil Health Pills */}
            <Text style={styles.soilHeader}>Soil Health Profile</Text>
            <View style={styles.soilPills}>
              {SOIL_PILLS.map(({ label, value, bg, textColor }) => (
                <View key={label} style={[styles.soilPill, { backgroundColor: bg }]}>
                  <Text style={styles.soilPillLabel}>{label}</Text>
                  <Text style={[styles.soilPillValue, { color: textColor }]}>{value}</Text>
                </View>
              ))}
            </View>

            {/* Fertilizer Calculator */}
            <View style={styles.fertCard}>
              <View style={styles.fertHeader}>
                <View style={styles.fertIconWrap}>
                  <MaterialIcons name="calculate" size={20} color={Colors.onPrimaryContainer} />
                </View>
                <Text style={styles.fertTitle}>Fertilizer Calculator</Text>
              </View>
              <View style={styles.fertItems}>
                {[
                  { icon: 'inventory-2', label: 'IFFCO Urea', qty: '3 Bags' },
                  { icon: 'inventory',   label: 'Single Super Phosphate', qty: '1 Bag' },
                ].map(({ label, qty }) => (
                  <View key={label} style={styles.fertItem}>
                    <View style={styles.fertItemIcon}>
                      <MaterialIcons name="inventory" size={28} color={Colors.outline} />
                    </View>
                    <View>
                      <Text style={styles.fertQty}>{qty}</Text>
                      <Text style={styles.fertLabel}>{label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Sidebar stats in a 2-col layout */}
        <View style={styles.sideRow}>
          {/* Weather */}
          <View style={styles.weatherWidget}>
            <View style={styles.weatherTop}>
              <MaterialIcons name="wb-sunny" size={32} color={Colors.tertiaryContainer} />
              <Text style={styles.weatherToday}>Today</Text>
            </View>
            <Text style={styles.weatherBigTemp}>28°C</Text>
            <Text style={styles.weatherCondition}>Partly Cloudy • High Humidity</Text>
            <View style={styles.precipTrack}>
              <View style={[styles.precipFill, { width: '12%' }]} />
            </View>
            <Text style={styles.precipLabel}>Precipitation: 12%</Text>
          </View>

          {/* Heatmap */}
          <View style={styles.heatmapWrap}>
            <Image source={{ uri: HEATMAP_URL }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            <View style={styles.heatmapOverlay} />
            <View style={styles.heatmapLabel}>
              <Text style={styles.heatmapTitle}>Live Heatmap</Text>
              <Text style={styles.heatmapSub}>Updated 14 mins ago</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Map New Farm FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/farm/map' as any)}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={[Colors.primary, '#004d34']}
          style={styles.fabGrad}
        >
          <MaterialIcons name="add-location-alt" size={22} color="#fff" />
          <Text style={styles.fabLabel}>Map New Farm</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.surface },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 12,
    backgroundColor: 'rgba(248,249,255,0.92)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06, shadowRadius: 16, elevation: 8,
  },
  avatar:        { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: Colors.primaryFixed },
  logo:          { fontSize: 24, fontWeight: '900', letterSpacing: -0.8, color: Colors.primary },
  notifBtn:      { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  subNav: {
    flexDirection: 'row', backgroundColor: Colors.surfaceContainerLow,
    paddingVertical: 10, paddingHorizontal: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.outlineVariant,
  },
  subNavBtn:     { flex: 1, alignItems: 'center', gap: 3 },
  subNavLabel:   { fontSize: 11, fontWeight: '700', color: Colors.primary, letterSpacing: 0.3 },

  scroll:        { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  pageTitle:     { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: Colors.onSurface },
  pageSub:       { fontSize: 14, color: Colors.onSurfaceVariant },

  farmCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xxl, overflow: 'hidden',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06, shadowRadius: 24, elevation: 4,
  },
  farmImgWrap:   { height: 180, position: 'relative' },
  farmImg:       { width: '100%', height: '100%' },
  farmImgBadges: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', gap: 8 },
  imgBadge: {
    backgroundColor: 'rgba(0,108,73,0.88)', borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  imgBadgeText:  { fontSize: 11, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  farmCardBody:  { padding: 20, gap: 16 },
  farmCardHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 },
  farmName:      { fontSize: 18, fontWeight: '700', color: Colors.onSurface },
  farmLocation:  { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  farmLocationText: { fontSize: 13, color: Colors.onSurfaceVariant },
  cropBadge: {
    backgroundColor: Colors.surfaceContainerHigh, borderRadius: Radii.lg,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  cropBadgeText: { fontSize: 13, fontWeight: '700', color: Colors.onSurface },

  soilHeader:    { fontSize: 11, fontWeight: '800', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1.2 },
  soilPills:     { flexDirection: 'row', gap: 8 },
  soilPill:      { borderRadius: Radii.lg, paddingHorizontal: 14, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  soilPillLabel: { fontSize: 16, fontWeight: '900', color: Colors.onSurface },
  soilPillValue: { fontSize: 12, fontWeight: '700' },

  fertCard: {
    backgroundColor: Colors.surfaceContainer, borderRadius: Radii.xl, padding: 14, gap: 12,
  },
  fertHeader:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fertIconWrap: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  fertTitle:     { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  fertItems:     { flexDirection: 'row', gap: 10 },
  fertItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.lg, padding: 12,
  },
  fertItemIcon: {
    width: 52, height: 52, borderRadius: 12, backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  fertQty:       { fontSize: 20, fontWeight: '900', color: Colors.onSurface },
  fertLabel:     { fontSize: 12, fontWeight: '700', color: Colors.primary },

  sideRow:       { flexDirection: 'row', gap: 12, height: 200 },
  weatherWidget: {
    flex: 1, backgroundColor: Colors.surfaceContainerLow, borderRadius: Radii.xxl, padding: 16, gap: 4,
  },
  weatherTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weatherToday:  { fontSize: 12, fontWeight: '700', color: Colors.onSurfaceVariant },
  weatherBigTemp:{ fontSize: 30, fontWeight: '900', color: Colors.onSurface },
  weatherCondition: { fontSize: 12, color: Colors.onSurfaceVariant },
  precipTrack:   { height: 6, backgroundColor: '#fff', borderRadius: 3, overflow: 'hidden' },
  precipFill:    { height: '100%', backgroundColor: Colors.tertiaryContainer, borderRadius: 3 },
  precipLabel:   { fontSize: 10, fontWeight: '700', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },

  heatmapWrap:   { flex: 1, borderRadius: Radii.xxl, overflow: 'hidden' },
  heatmapOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)' },
  heatmapLabel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(255,255,255,0.82)', padding: 12,
  },
  heatmapTitle:  { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  heatmapSub:    { fontSize: 11, color: Colors.onSurfaceVariant },

  fab:           { position: 'absolute', bottom: 98, right: 20 },
  fabGrad: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 14, borderRadius: Radii.xl,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
  fabLabel:      { fontSize: 14, fontWeight: '700', color: '#fff' },
});
