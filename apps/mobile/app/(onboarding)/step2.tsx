import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

export default function OnboardingStep2() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.brand}>Agronavis</Text>
        <View style={styles.w10} />
      </View>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={styles.progressRow}>
          <Text style={styles.stepLabel}>Step 2 of 3</Text>
          <Text style={styles.stepSub}>Location</Text>
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          />
        </View>
      </View>

      {/* Main */}
      <View style={styles.content}>
        <Text style={styles.title}>Where is your primary field?</Text>
        <Text style={styles.subtitle}>
          We use this to fetch localized weather data and soil telemetry.
        </Text>

        {/* Search bar (visual) */}
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={Colors.outline} />
          <Text style={styles.searchPlaceholder}>Enter farm address or coordinates</Text>
        </View>

        {/* Location button */}
        <TouchableOpacity style={styles.locationBtn} activeOpacity={0.8}>
          <MaterialIcons name="my-location" size={20} color={Colors.primary} />
          <Text style={styles.locationText}>Use Current Location</Text>
        </TouchableOpacity>

        {/* Map preview */}
        <View style={styles.mapWrap}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=800&q=80' }}
            style={styles.mapImage}
            resizeMode="cover"
          />
          <View style={styles.mapOverlay} />
          <View style={styles.pinWrap}>
            <MaterialIcons name="location-on" size={40} color={Colors.primary} />
          </View>
          <View style={styles.mapLabel}>
            <Text style={styles.mapLabelText}>Tap to select location</Text>
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/step3' as any)}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.nextGradient}
          >
            <Text style={styles.nextText}>Next</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
  },
  backBtn:       { padding: 8, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh },
  brand:         { fontSize: 20, fontWeight: '900', color: Colors.primary },
  w10:           { width: 38 },
  progressWrap:  { paddingHorizontal: 24, marginBottom: 8 },
  progressRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  stepLabel:     { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  stepSub:       { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  progressTrack: { height: 8, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 4, overflow: 'hidden' },
  progressFill:  { width: '66.66%', height: '100%', borderRadius: 4 },
  content:       { flex: 1, paddingHorizontal: 24, gap: 14 },
  title:         { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: Colors.onSurface },
  subtitle:      { fontSize: 15, color: Colors.onSurfaceVariant, lineHeight: 22 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radii.lg, height: 52, paddingHorizontal: 16,
  },
  searchPlaceholder: { fontSize: 15, color: Colors.outline, flex: 1 },
  locationBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.surfaceContainerHigh, borderRadius: Radii.lg, height: 52,
  },
  locationText:  { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  mapWrap:       { flex: 1, borderRadius: Radii.xl, overflow: 'hidden', minHeight: 200 },
  mapImage:      { width: '100%', height: '100%' },
  mapOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  pinWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  mapLabel: {
    position: 'absolute', bottom: 16, left: 16, right: 16,
    backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: Radii.lg,
    paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center',
  },
  mapLabelText:  { fontSize: 14, fontWeight: '600', color: Colors.onSurface },
  footer:        { padding: 24, paddingBottom: 40 },
  nextGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: Radii.xxl, gap: 8,
  },
  nextText:      { fontSize: 17, fontWeight: '700', color: '#fff' },
});
