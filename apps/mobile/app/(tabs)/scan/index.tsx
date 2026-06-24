/**
 * Scan Screen — Real camera using expo-camera v17 CameraView
 *
 * Works on all phones: uses the new CameraView API (not the deprecated Camera).
 * - Shutter → takePictureAsync → navigate to result with real URI
 * - Gallery → ImagePicker → navigate to result with picked URI
 * - Flash toggle
 * - Camera permission handled inline
 */
import { useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
  ActivityIndicator, Platform, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { CameraView, CameraType, useCameraPermissions, FlashMode } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radii } from '@/constants/theme';

const CORNER_SIZE  = 44;
const CORNER_THICK = 4;
const CORNER_COLOR = Colors.primaryContainer;

export default function ScanScreen() {
  const router  = useRouter();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing]   = useState<CameraType>('back');
  const [flash,  setFlash]    = useState<FlashMode>('off');
  const [busy,   setBusy]     = useState(false);
  // isFocused: true only while this tab is active — gates CameraView mount
  // so the camera hardware releases when you navigate away.
  const [isFocused, setIsFocused] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      return () => {
        // Called when screen loses focus — unmounts CameraView, releases camera
        setIsFocused(false);
      };
    }, [])
  );

  // Request permission on mount if not yet decided
  useFocusEffect(
    useCallback(() => {
      if (permission && !permission.granted && permission.canAskAgain) {
        requestPermission();
      }
    }, [permission])
  );

  // ── Capture ──
  async function handleCapture() {
    if (busy || !cameraRef.current) return;
    setBusy(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.75 });
      if (photo?.uri) {
        router.push({ pathname: '/(tabs)/scan/result', params: { imageUri: photo.uri } } as any);
      }
    } catch (e) {
      console.warn('Capture error:', e);
    } finally {
      setBusy(false);
    }
  }

  // ── Gallery ──
  async function handleGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.75,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets[0]) {
      router.push({ pathname: '/(tabs)/scan/result', params: { imageUri: result.assets[0].uri } } as any);
    }
  }

  // ── Permission not decided yet ──
  if (!permission) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  // ── Permission denied ──
  if (!permission.granted) {
    return (
      <View style={styles.centered}>
        <MaterialIcons name="no-photography" size={56} color={Colors.outline} />
        <Text style={styles.permTitle}>Camera access needed</Text>
        <Text style={styles.permSub}>Agronavis needs your camera to scan plant diseases.</Text>
        <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
          <Text style={styles.permBtnText}>Grant Camera Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.galleryFallback} onPress={handleGallery}>
          <MaterialIcons name="photo-library" size={20} color={Colors.primary} />
          <Text style={styles.galleryFallbackText}>Choose from Gallery instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Camera ready ──
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000" translucent />

      {/* ── Live camera (only mounted while tab is active) ── */}
      <View style={styles.cameraWrap}>
        {isFocused && (
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={facing}
            flash={flash}
          />
        )}

        {/* Top bar */}
        <View style={styles.camTopBar}>
          <Text style={styles.camLogo}>Agronavis</Text>
          <TouchableOpacity style={styles.camIconBtn} onPress={() => setFlash(f => f === 'off' ? 'on' : 'off')}>
            <MaterialIcons name={flash === 'on' ? 'flash-on' : 'flash-off'} size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Scan corners */}
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

        {/* Controls */}
        <View style={styles.controls}>
          {/* Flip camera */}
          <TouchableOpacity
            style={styles.controlBtn}
            onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')}
          >
            <MaterialIcons name="flip-camera-android" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Capture */}
          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} activeOpacity={0.85} disabled={busy}>
            <View style={styles.captureBtnInner}>
              {busy && <ActivityIndicator color="#fff" />}
            </View>
          </TouchableOpacity>

          {/* Gallery */}
          <TouchableOpacity style={styles.controlBtn} onPress={handleGallery}>
            <MaterialIcons name="photo-library" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Bottom tips ── */}
      <View style={styles.bottomSection}>
        <Text style={styles.tipsHeader}>Scanning Tips</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {TIPS.map(tip => (
            <View key={tip.label} style={styles.tipCard}>
              <MaterialIcons name={tip.icon as any} size={22} color={Colors.primary} />
              <Text style={styles.tipText}>{tip.label}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const TIPS = [
  { icon: 'wb-sunny',     label: 'Avoid Midday Shadows' },
  { icon: 'straighten',   label: 'Keep 15 cm Distance' },
  { icon: 'center-focus-strong', label: 'Focus on 1 Leaf' },
  { icon: 'brightness-7', label: 'Good Lighting Helps' },
];

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#0d0d0d' },
  centered:    { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  permTitle:   { fontSize: 20, fontWeight: '800', color: Colors.onSurface, textAlign: 'center' },
  permSub:     { fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 21 },
  permBtn: {
    backgroundColor: Colors.primary, borderRadius: Radii.xxl,
    paddingHorizontal: 28, paddingVertical: 14, marginTop: 8,
  },
  permBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
  galleryFallback: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  galleryFallbackText: { fontSize: 14, fontWeight: '600', color: Colors.primary },

  cameraWrap:  { flex: 1.3, position: 'relative', overflow: 'hidden' },

  camTopBar: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 44, left: 20, right: 20, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  camLogo:   { fontSize: 22, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  camIconBtn:{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  frameWrap: { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
  cornerTL:  { position: 'absolute', top: '20%', left: '15%', width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderColor: CORNER_COLOR, borderRadius: 6 },
  cornerTR:  { position: 'absolute', top: '20%', right: '15%', width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderColor: CORNER_COLOR, borderRadius: 6 },
  cornerBL:  { position: 'absolute', bottom: '28%', left: '15%', width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderColor: CORNER_COLOR, borderRadius: 6 },
  cornerBR:  { position: 'absolute', bottom: '28%', right: '15%', width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderColor: CORNER_COLOR, borderRadius: 6 },

  hintWrap:  { position: 'absolute', bottom: '22%', left: 0, right: 0, alignItems: 'center' },
  hintText: {
    backgroundColor: 'rgba(0,0,0,0.45)', color: 'rgba(255,255,255,0.88)',
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radii.full,
    fontSize: 13, fontWeight: '500', overflow: 'hidden',
  },

  controls: {
    position: 'absolute', bottom: 24, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly',
  },
  controlBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
  captureBtn: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff', padding: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 10,
  },
  captureBtnInner: { flex: 1, borderRadius: 35, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },

  bottomSection:  { backgroundColor: Colors.surface, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 90, gap: 12 },
  tipsHeader:     { fontSize: 15, fontWeight: '800', color: Colors.onSurface },
  tipCard: {
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Radii.xl,
    paddingHorizontal: 16, paddingVertical: 14, gap: 8, alignItems: 'center', width: 130,
  },
  tipText: { fontSize: 12, fontWeight: '700', color: Colors.onSurface, textAlign: 'center' },
});
