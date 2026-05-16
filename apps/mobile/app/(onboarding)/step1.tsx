import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

const CROPS = ['Wheat', 'Rice', 'Corn', 'Soybeans', 'Cotton', 'Sugarcane', 'Other'];

export default function OnboardingStep1() {
  const router = useRouter();
  const [selectedCrop, setSelectedCrop] = useState('');
  const [farmSize,     setFarmSizeIdx]  = useState(2); // index into size options

  const SIZE_LABELS = ['< 1 Acre', '1–5 Acres', '5–25 Acres', '25–100 Acres', '100+ Acres'];

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>Agronavis</Text>
        <View style={styles.progressRow}>
          <Text style={styles.stepLabel}>Step 1 of 3</Text>
          <View style={styles.dots}>
            {[0, 1, 2].map(i => (
              <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
            ))}
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile avatar placeholder */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="person" size={52} color={Colors.onSurfaceVariant} />
          </View>
          <TouchableOpacity style={styles.avatarBadge}>
            <MaterialIcons name="add-a-photo" size={16} color={Colors.onPrimary} />
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Upload Profile Photo</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>Welcome to the Field</Text>
        <Text style={styles.subtitle}>
          Let's set up your profile to calibrate our systems for your operation.
        </Text>

        {/* Primary Crop */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Primary Crop Focus</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropScroll}>
            {CROPS.map(crop => (
              <TouchableOpacity
                key={crop}
                style={[styles.cropChip, selectedCrop === crop && styles.cropChipActive]}
                onPress={() => setSelectedCrop(crop)}
                activeOpacity={0.8}
              >
                <Text style={[styles.cropChipText, selectedCrop === crop && styles.cropChipTextActive]}>
                  {crop}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Farm Size */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Operation Scale</Text>
          <View style={styles.sizeRow}>
            {SIZE_LABELS.map((label, i) => (
              <TouchableOpacity
                key={label}
                style={[styles.sizeChip, farmSize === i && styles.sizeChipActive]}
                onPress={() => setFarmSizeIdx(i)}
                activeOpacity={0.8}
              >
                <Text style={[styles.sizeChipText, farmSize === i && styles.sizeChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Action */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.nextBtn}
          onPress={() => router.push('/(onboarding)/step2' as any)}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.nextGradient}
          >
            <Text style={styles.nextText}>Next Step</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:            { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 24, paddingTop: 56, paddingBottom: 16,
    backgroundColor: 'rgba(248,249,255,0.9)',
  },
  brand:           { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  progressRow:     { alignItems: 'flex-end', gap: 6 },
  stepLabel:       { fontSize: 13, fontWeight: '600', color: Colors.primary },
  dots:            { flexDirection: 'row', gap: 6 },
  dot:             { width: 28, height: 7, borderRadius: 4, backgroundColor: Colors.surfaceContainerHighest },
  dotActive:       { backgroundColor: Colors.primary },
  scroll:          { paddingHorizontal: 24, paddingBottom: 24 },
  avatarWrap:      { alignItems: 'center', marginTop: 24, marginBottom: 28, gap: 8 },
  avatarCircle: {
    width: 108, height: 108, borderRadius: 54,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07, shadowRadius: 16, elevation: 4,
  },
  avatarBadge: {
    position: 'absolute', bottom: 28, right: '30%',
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  avatarHint:      { fontSize: 13, fontWeight: '500', color: Colors.onSurfaceVariant },
  title:           { fontSize: 30, fontWeight: '800', letterSpacing: -0.6, color: Colors.onSurface, textAlign: 'center', marginBottom: 8 },
  subtitle:        { fontSize: 15, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  section:         { gap: 12, marginBottom: 24 },
  sectionLabel:    { fontSize: 13, fontWeight: '700', color: Colors.onSurface, textTransform: 'uppercase', letterSpacing: 0.8 },
  cropScroll:      { marginHorizontal: -4 },
  cropChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: Radii.full,
    backgroundColor: Colors.surfaceContainerHigh, marginHorizontal: 4,
  },
  cropChipActive:  { backgroundColor: Colors.primary },
  cropChipText:    { fontSize: 14, fontWeight: '600', color: Colors.onSurface },
  cropChipTextActive: { color: '#fff' },
  sizeRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sizeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radii.lg,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  sizeChipActive:  { backgroundColor: Colors.primaryFixed },
  sizeChipText:    { fontSize: 13, fontWeight: '500', color: Colors.onSurface },
  sizeChipTextActive: { fontWeight: '700', color: Colors.primary },
  footer:          { padding: 24, paddingBottom: 40 },
  nextBtn:         { borderRadius: Radii.xxl, overflow: 'hidden' },
  nextGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, gap: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  nextText:        { fontSize: 17, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
});
