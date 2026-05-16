import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

const SCAN_IMG = 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=600&q=80';

export default function ScanScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />

      {/* Camera Area */}
      <View style={styles.cameraWrap}>
        <Image source={{ uri: SCAN_IMG }} style={StyleSheet.absoluteFill} resizeMode="cover" />

        {/* Dark overlay */}
        <View style={styles.darkOverlay} />

        {/* Top bar inside camera */}
        <View style={styles.camTopBar}>
          <Text style={styles.camLogo}>Agronavis</Text>
          <TouchableOpacity style={styles.camNotif}>
            <MaterialIcons name="notifications-none" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Scanner frame corners */}
        <View style={styles.frameWrap}>
          <View style={styles.cornerTL} />
          <View style={styles.cornerTR} />
          <View style={styles.cornerBL} />
          <View style={styles.cornerBR} />
        </View>

        {/* Hint */}
        <View style={styles.hintWrap}>
          <Text style={styles.hintText}>Point camera at affected leaves</Text>
        </View>

        {/* Camera controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlBtn}>
            <MaterialIcons name="flash-on" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Capture button */}
          <TouchableOpacity
            style={styles.captureBtn}
            onPress={() => router.push('/(tabs)/scan/result' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlBtn}>
            <MaterialIcons name="photo-library" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom section */}
      <View style={styles.bottomSection}>
        {/* Recent scan */}
        <Text style={styles.recentHeader}>Recent Scan Result</Text>
        <TouchableOpacity
          style={styles.recentCard}
          onPress={() => router.push('/(tabs)/scan/result' as any)}
          activeOpacity={0.88}
        >
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=200&q=70' }}
            style={styles.recentThumb}
          />
          <View style={styles.recentInfo}>
            <Text style={styles.recentDetected}>DETECTED</Text>
            <View style={styles.recentTitleRow}>
              <Text style={styles.recentDisease}>Early Blight</Text>
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>Action Required</Text>
              </View>
            </View>
            <Text style={styles.recentConfidence}>94% confidence level</Text>
          </View>
          <MaterialIcons name="arrow-forward-ios" size={16} color={Colors.primary} />
        </TouchableOpacity>

        {/* Tips */}
        <View style={styles.tipsRow}>
          <View style={styles.tipCard}>
            <MaterialIcons name="wb-sunny" size={24} color={Colors.tertiaryContainer} />
            <Text style={styles.tipText}>Avoid Midday Shadows</Text>
          </View>
          <View style={styles.tipCard}>
            <MaterialIcons name="straighten" size={24} color={Colors.primary} />
            <Text style={styles.tipText}>Keep 15cm Distance</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const CORNER_SIZE = 44;
const CORNER_THICK = 4;
const CORNER_COLOR = Colors.primaryContainer;

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#0d0d0d' },
  cameraWrap:   { flex: 1.2, position: 'relative' },
  darkOverlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  camTopBar: {
    position: 'absolute', top: 52, left: 20, right: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  camLogo:      { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  camNotif:     { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  frameWrap: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  cornerTL: {
    position: 'absolute', top: '20%', left: '15%',
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK,
    borderColor: CORNER_COLOR, borderRadius: 6,
  },
  cornerTR: {
    position: 'absolute', top: '20%', right: '15%',
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK,
    borderColor: CORNER_COLOR, borderRadius: 6,
  },
  cornerBL: {
    position: 'absolute', bottom: '28%', left: '15%',
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK,
    borderColor: CORNER_COLOR, borderRadius: 6,
  },
  cornerBR: {
    position: 'absolute', bottom: '28%', right: '15%',
    width: CORNER_SIZE, height: CORNER_SIZE,
    borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK,
    borderColor: CORNER_COLOR, borderRadius: 6,
  },
  hintWrap: {
    position: 'absolute', bottom: '22%', left: 0, right: 0, alignItems: 'center',
  },
  hintText: {
    backgroundColor: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.85)',
    paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radii.full,
    fontSize: 13, fontWeight: '500', overflow: 'hidden',
  },
  controls: {
    position: 'absolute', bottom: 24, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly',
  },
  controlBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  captureBtn: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: '#fff', padding: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  captureBtnInner: {
    flex: 1, borderRadius: 33,
    backgroundColor: Colors.primary,
  },

  bottomSection: {
    backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 20, gap: 14, paddingBottom: 90,
  },
  recentHeader: { fontSize: 16, fontWeight: '800', color: Colors.onSurface },
  recentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xl, padding: 14,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05, shadowRadius: 12, elevation: 3,
  },
  recentThumb:     { width: 76, height: 76, borderRadius: Radii.lg },
  recentInfo:      { flex: 1, gap: 4 },
  recentDetected:  { fontSize: 10, fontWeight: '800', color: Colors.onSurfaceVariant, letterSpacing: 1 },
  recentTitleRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  recentDisease:   { fontSize: 17, fontWeight: '800', color: Colors.onSurface },
  actionBadge: {
    backgroundColor: Colors.errorContainer, borderRadius: Radii.full,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  actionBadgeText: { fontSize: 10, fontWeight: '800', color: Colors.onErrorContainer },
  recentConfidence:{ fontSize: 13, color: Colors.onSurfaceVariant },
  tipsRow:         { flexDirection: 'row', gap: 12 },
  tipCard: {
    flex: 1, backgroundColor: Colors.surfaceContainerLow, borderRadius: Radii.xl,
    padding: 16, gap: 8,
  },
  tipText:         { fontSize: 13, fontWeight: '700', color: Colors.onSurface },
});
