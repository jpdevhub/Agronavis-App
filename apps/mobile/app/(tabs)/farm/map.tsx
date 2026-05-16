import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

const MAP_URL = 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80';

export default function MapNewFarmScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Map New Farm Area</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Colors.outline} />
        <Text style={styles.searchPlaceholder}>Enter farm address or coordinates</Text>
      </View>
      <TouchableOpacity style={styles.locationBtn} activeOpacity={0.8}>
        <MaterialIcons name="my-location" size={20} color={Colors.primary} />
        <Text style={styles.locationText}>Use Current Location</Text>
      </TouchableOpacity>
      <View style={styles.mapWrap}>
        <Image source={{ uri: MAP_URL }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <View style={styles.overlay} />
        <View style={styles.pinCenter}>
          <MaterialIcons name="location-on" size={44} color={Colors.primary} />
        </View>
        <View style={styles.mapCard}>
          <Text style={styles.mapCardTitle}>Tap to drop pin</Text>
          <Text style={styles.mapCardSub}>Long press to adjust boundary</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity activeOpacity={0.88}>
          <LinearGradient colors={[Colors.primary, Colors.primaryContainer]} style={styles.saveBtn}>
            <MaterialIcons name="save" size={20} color="#fff" />
            <Text style={styles.saveBtnText}>Save Farm Area</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: 'rgba(248,249,255,0.95)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  backBtn:        { padding: 8, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh },
  headerTitle:    { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16,
    backgroundColor: Colors.surfaceContainerHighest, borderRadius: Radii.lg, height: 50, paddingHorizontal: 14,
  },
  searchPlaceholder: { fontSize: 15, color: Colors.outline },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.surfaceContainerHigh, borderRadius: Radii.lg, height: 46, marginHorizontal: 16,
  },
  locationText:   { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  mapWrap:        { flex: 1, margin: 16, borderRadius: Radii.xl, overflow: 'hidden' },
  overlay:        { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  pinCenter:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  mapCard: {
    position: 'absolute', bottom: 14, left: 14, right: 14,
    backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: Radii.lg, padding: 14,
    alignItems: 'center',
  },
  mapCardTitle:   { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  mapCardSub:     { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  footer:         { padding: 20, paddingBottom: 36 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 56, borderRadius: Radii.xxl,
  },
  saveBtnText:    { fontSize: 17, fontWeight: '700', color: '#fff' },
});
