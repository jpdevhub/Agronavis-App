/**
 * Scan Result Screen
 *
 * Receives `imageUri` from the scan screen via router params.
 * Shows the captured image and a deterministic disease result.
 * (In production, replace the mock detection with your TFLite/API inference.)
 */
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ScrollView, Image, ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

// Static treatment plan (shown until live inference is integrated)
const TREATMENT_PLANS: Record<string, { disease: string; sci: string; severity: number; steps: string[] }> = {
  default: {
    disease: 'Early Blight',
    sci:     'Alternaria solani',
    severity: 0.6,
    steps: [
      'Remove and destroy infected plant debris immediately.',
      'Apply copper-based fungicide every 7–10 days.',
      'Avoid overhead irrigation to reduce moisture on foliage.',
      'Ensure good air circulation by proper plant spacing.',
    ],
  },
};

export default function ScanResultScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();

  const result     = TREATMENT_PLANS['default'];
  const displayUri = imageUri ?? 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=600&q=80';
  const confidence = 94;

  const severityLabel = result.severity < 0.35 ? 'Mild' : result.severity < 0.65 ? 'Moderate' : 'Severe';
  const severityColor = result.severity < 0.35
    ? Colors.primaryContainer
    : result.severity < 0.65
      ? Colors.tertiaryFixed ?? Colors.primaryContainer
      : Colors.error;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan Result</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <MaterialIcons name="share" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Captured image */}
        <View style={styles.imageCard}>
          <Image source={{ uri: displayUri }} style={styles.leafImage} resizeMode="cover" />
          <View style={styles.imageOverlay} />
          <View style={styles.confidenceWrap}>
            <View style={styles.confidenceBadge}>
              <MaterialIcons name="verified" size={16} color={Colors.primary} />
              <Text style={styles.confidenceText}>{confidence}% Confidence</Text>
            </View>
          </View>
        </View>

        {/* Disease card */}
        <View style={styles.diseaseCard}>
          <View style={styles.diseaseBadge}>
            <Text style={styles.diseaseBadgeText}>DETECTED</Text>
          </View>
          <Text style={styles.diseaseName}>{result.disease}</Text>
          <Text style={styles.diseaseSci}>{result.sci}</Text>
          <View style={styles.severityRow}>
            <Text style={styles.severityLabel}>Severity</Text>
            <View style={styles.severityTrack}>
              <View style={[styles.severityFill, { width: `${result.severity * 100}%`, backgroundColor: severityColor }]} />
            </View>
            <Text style={styles.severityValue}>{severityLabel}</Text>
          </View>
        </View>

        {/* Treatment plan */}
        <View style={styles.treatmentCard}>
          <View style={styles.treatmentHeader}>
            <MaterialIcons name="healing" size={22} color={Colors.primary} />
            <Text style={styles.treatmentTitle}>Treatment Plan</Text>
          </View>
          {result.steps.map((text, i) => (
            <View key={i} style={styles.treatRow}>
              <View style={styles.stepBubble}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{text}</Text>
            </View>
          ))}
        </View>

        {/* Scan another */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.replace('/(tabs)/scan' as any)}>
          <LinearGradient colors={[Colors.primary, '#004d34']} style={styles.newScanBtn}>
            <MaterialIcons name="photo-camera" size={20} color="#fff" />
            <Text style={styles.newScanText}>Scan Another Plant</Text>
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: 'rgba(248,249,255,0.95)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  headerBtn:   { padding: 8, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  scroll:      { padding: 20, gap: 16 },

  imageCard:       { borderRadius: Radii.xxl, overflow: 'hidden', height: 230 },
  leafImage:       { width: '100%', height: '100%' },
  imageOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  confidenceWrap:  { position: 'absolute', bottom: 16, right: 16 },
  confidenceBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 6 },
  confidenceText:  { fontSize: 13, fontWeight: '800', color: Colors.primary },

  diseaseCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xxl, padding: 20, gap: 8,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 3,
  },
  diseaseBadge:    { alignSelf: 'flex-start', backgroundColor: Colors.errorContainer, borderRadius: Radii.full, paddingHorizontal: 12, paddingVertical: 4 },
  diseaseBadgeText:{ fontSize: 11, fontWeight: '900', color: Colors.onErrorContainer, letterSpacing: 1 },
  diseaseName:     { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, color: Colors.onSurface },
  diseaseSci:      { fontSize: 14, fontStyle: 'italic', color: Colors.onSurfaceVariant },
  severityRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  severityLabel:   { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  severityTrack:   { flex: 1, height: 8, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 4, overflow: 'hidden' },
  severityFill:    { height: '100%', borderRadius: 4 },
  severityValue:   { fontSize: 13, fontWeight: '700', color: Colors.onSurface },

  treatmentCard: {
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xxl, padding: 20, gap: 14,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.05, shadowRadius: 16, elevation: 3,
  },
  treatmentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  treatmentTitle:  { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  treatRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepBubble:      { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  stepNum:         { fontSize: 13, fontWeight: '900', color: Colors.primary },
  stepText:        { flex: 1, fontSize: 14, color: Colors.onSurface, lineHeight: 20 },

  newScanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: Radii.xxl, gap: 10,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  newScanText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});
