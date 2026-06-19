/**
 * FarmFieldDrawer
 *
 * Shared satellite map component for drawing a 4-point field polygon.
 * Used in:
 *   - Onboarding Step 2 (mode="onboarding")
 *   - Farm › Add Field  (mode="add-field")
 *
 * On complete it creates the farms + farm_fields rows in Supabase and
 * calls `onComplete`. `onSkip` lets the caller bypass the screen.
 */
import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, Platform, KeyboardAvoidingView,
} from 'react-native';
import MapView, { Marker, Polygon, PROVIDER_DEFAULT, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { supabase } from '@/utils/supabase';

// ─── Types ───────────────────────────────────────────────────────────────────

type LatLng = { latitude: number; longitude: number };

export type FarmFieldDrawerMode = 'onboarding' | 'add-field';

export interface FarmFieldDrawerProps {
  mode: FarmFieldDrawerMode;
  onComplete: () => void;
  onBack: () => void;
  onSkip?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Haversine-corrected Shoelace formula: lat/lon polygon → acres */
function computeAcres(coords: LatLng[]): number {
  if (coords.length < 3) return 0;
  const avgLat = coords.reduce((s, p) => s + p.latitude, 0) / coords.length;
  const mPerLat = 111_320;
  const mPerLon = 111_320 * Math.cos(avgLat * (Math.PI / 180));
  const pts     = coords.map(p => ({ x: p.longitude * mPerLon, y: p.latitude * mPerLat }));
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return parseFloat((Math.abs(area) / 2 / 4046.86).toFixed(2));
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FarmFieldDrawer({
  mode, onComplete, onBack, onSkip,
}: FarmFieldDrawerProps) {
  const user          = useAuthStore((s) => s.user);
  const { setLocation } = useOnboardingStore();
  const mapRef        = useRef<MapView>(null);

  const [region, setRegion]   = useState({ latitude: 20.5937, longitude: 78.9629, latitudeDelta: 0.003, longitudeDelta: 0.003 });
  const [pins, setPins]       = useState<LatLng[]>([]);
  const [locating, setLocating] = useState(false);
  const [mapReady, setMapReady] = useState(true); // show map at India centre immediately; GPS animates on top
  const [saving, setSaving]   = useState(false);
  const [locName, setLocName] = useState('');
  const [fieldName, setFieldName] = useState('');

  useEffect(() => { flyToLocation(); }, []);

  // ── Helpers ──

  async function flyToLocation() {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return; // map already visible at fallback centre

      // Fast path: last-known position → animate map immediately
      const last = await Location.getLastKnownPositionAsync();
      if (last) {
        const r = { latitude: last.coords.latitude, longitude: last.coords.longitude, latitudeDelta: 0.003, longitudeDelta: 0.003 };
        setRegion(r);
        mapRef.current?.animateToRegion(r, 400);
      }

      // Precise path: 10-second timeout so it never hangs on Android
      const gpsPromise = Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const timeout    = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10_000));
      const result     = await Promise.race([gpsPromise, timeout]);
      if (!result) return; // timed out — last-known is good enough

      const { coords } = result;
      const r = { latitude: coords.latitude, longitude: coords.longitude, latitudeDelta: 0.003, longitudeDelta: 0.003 };
      setRegion(r);
      mapRef.current?.animateToRegion(r, 600);

      // Reverse geocode for label
      const geo = await Location.reverseGeocodeAsync({ latitude: coords.latitude, longitude: coords.longitude });
      if (geo[0]) {
        const s = geo[0].region ?? '';
        const d = geo[0].subregion ?? geo[0].city ?? '';
        setLocName([d, s].filter(Boolean).join(', '));
        if (mode === 'onboarding') setLocation(s, d);
      }
    } catch {
      // Silently ignored — map is already visible at fallback or last-known position
    } finally {
      setLocating(false);
    }
  }

  function handleMapPress(e: { nativeEvent: { coordinate: LatLng } }) {
    if (pins.length >= 4) return;
    const coord = e?.nativeEvent?.coordinate;
    if (!coord) return;
    setPins(prev => [...prev, coord]);
  }

  function undoPin()  { setPins(p => p.slice(0, -1)); }
  function clearPins(){ setPins([]); setFieldName(''); }

  async function handleSave() {
    if (pins.length !== 4 || !fieldName.trim() || !user) return;
    setSaving(true);
    try {
      const centerLat  = pins.reduce((s, p) => s + p.latitude,  0) / 4;
      const centerLon  = pins.reduce((s, p) => s + p.longitude, 0) / 4;
      const acres      = computeAcres(pins);

      // 1. Ensure parent farm exists (FK: farm_fields.farm_id → farms.id)
      let farmId: string;
      const { data: existing } = await supabase
        .from('farms')
        .select('id')
        .eq('farmer_id', user.id)
        .limit(1);

      if (existing && existing.length > 0) {
        farmId = existing[0].id;
      } else {
        const { data: newFarm, error: farmErr } = await supabase
          .from('farms')
          .insert({ farmer_id: user.id, name: 'My Farm', area_acres: acres > 0 ? acres : 1.0 })
          .select('id')
          .single();
        if (farmErr) throw farmErr;
        farmId = newFarm.id;
      }

      // 2. Insert field (FK: farm_fields.farm_id → farms.id)
      const { error: fieldErr } = await supabase
        .from('farm_fields')
        .insert({
          farm_id:          farmId,
          name:             fieldName.trim(),
          area_acres:       acres > 0 ? acres : 1.0,
          polygon:          { type: 'Polygon', coordinates: pins },
          center_latitude:  parseFloat(centerLat.toFixed(6)),
          center_longitude: parseFloat(centerLon.toFixed(6)),
        });
      if (fieldErr) throw fieldErr;

      onComplete();
    } catch (err: any) {
      Alert.alert('Error saving field', err?.message ?? 'Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Derived state ──

  const polygonReady    = pins.length === 4;
  const estimatedAcres  = computeAcres(pins);
  const isOnboarding    = mode === 'onboarding';

  // ─── Render ────────────────────────────────────────────────────────────────

  // Show a GPS-acquiring screen until we have a real coordinate.
  // This ensures the map opens directly at field-level zoom in satellite mode.
  if (!mapReady) {
    return (
      <View style={styles.gpsWait}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.gpsText}>Finding your location…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* ── Top header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.headerIconBtn}>
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Map Your Farm</Text>
          {isOnboarding && (
            <View style={styles.stepPill}>
              <Text style={styles.stepText}>Step 2 of 3</Text>
            </View>
          )}
        </View>

        {onSkip ? (
          <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerIconBtn} />   /* spacer */
        )}
      </View>

      {/* ── Map ── */}
      {/* Use PROVIDER_GOOGLE on Android so satellite tiles work in the APK.
          PROVIDER_DEFAULT on iOS uses Apple Maps which also supports satellite. */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        style={styles.map}
        mapType="satellite"
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {pins.map((pin, i) => (
          <Marker key={i} coordinate={pin}>
            <View style={styles.markerWrap}>
              <View style={styles.markerBubble}>
                <Text style={styles.markerNum}>{i + 1}</Text>
              </View>
              <View style={styles.markerTail} />
            </View>
          </Marker>
        ))}

        {pins.length >= 3 && (
          <Polygon
            coordinates={pins}
            strokeColor={Colors.primary}
            fillColor="rgba(0,180,100,0.22)"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* ── Instruction banner ── */}
      {!polygonReady && (
        <View style={styles.banner}>
          <MaterialIcons name="touch-app" size={16} color="#fff" />
          <Text style={styles.bannerText}>
            Tap {4 - pins.length} more corner{4 - pins.length !== 1 ? 's' : ''} to outline your field
          </Text>
        </View>
      )}

      {/* ── Pin dots + controls ── */}
      <View style={styles.controls}>
        <View style={styles.pinRow}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={[styles.pinDot, i < pins.length && styles.pinDotFilled]}>
              <Text style={[styles.pinNum, i < pins.length && styles.pinNumFilled]}>{i + 1}</Text>
            </View>
          ))}
        </View>
        <View style={styles.ctrlRow}>
          <TouchableOpacity style={styles.ctrlBtn} onPress={undoPin} disabled={pins.length === 0}>
            <MaterialIcons name="undo" size={20} color={pins.length === 0 ? Colors.outline : Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.ctrlBtn} onPress={clearPins} disabled={pins.length === 0}>
            <MaterialIcons name="delete-outline" size={20} color={pins.length === 0 ? Colors.outline : '#ef4444'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── My Location FAB ── */}
      <TouchableOpacity style={styles.locFab} onPress={flyToLocation}>
        {locating
          ? <ActivityIndicator size="small" color={Colors.primary} />
          : <MaterialIcons name="my-location" size={22} color={Colors.primary} />
        }
      </TouchableOpacity>

      {/* ── Bottom sheet ── */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        {!polygonReady ? (
          <>
            <Text style={styles.sheetTitle}>Where is your field?</Text>
            {!!locName && (
              <View style={styles.locRow}>
                <MaterialIcons name="location-on" size={15} color={Colors.primary} />
                <Text style={styles.locText}>{locName}</Text>
              </View>
            )}
            <Text style={styles.sheetSub}>
              Tap 4 corners of your field on the satellite map to draw its boundary.
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.sheetTitle}>Name This Field</Text>
            <View style={styles.nameInput}>
              <MaterialIcons name="edit" size={18} color={Colors.outline} />
              <TextInput
                style={styles.nameText}
                placeholder="e.g. North Plot"
                placeholderTextColor={Colors.outline}
                value={fieldName}
                onChangeText={setFieldName}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.areaBadge}>
              <MaterialIcons name="straighten" size={14} color={Colors.primary} />
              <Text style={styles.areaText}>~{estimatedAcres} acres</Text>
            </View>
            <TouchableOpacity onPress={handleSave} disabled={saving || !fieldName.trim()}>
              <LinearGradient
                colors={fieldName.trim() ? [Colors.primary, '#004d34'] : ['#ccc', '#bbb']}
                style={styles.saveBtn}
              >
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <><MaterialIcons name="check" size={20} color="#fff" /><Text style={styles.saveBtnText}>Save & Continue</Text></>
                }
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity onPress={clearPins} style={styles.redrawBtn}>
              <Text style={styles.redrawText}>Redraw boundary</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  map:  { flex: 1 },

  // Header
  header: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  headerIconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerTitle:  { fontSize: 16, fontWeight: '800', color: '#fff' },
  stepPill: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radii.full,
    paddingHorizontal: 10, paddingVertical: 3,
  },
  stepText:  { fontSize: 11, fontWeight: '700', color: '#fff' },
  skipBtn:   { paddingHorizontal: 8, paddingVertical: 6 },
  skipText:  { fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },

  // Instruction banner
  banner: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 120 : 108,
    left: 16, right: 16, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: Radii.lg,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bannerText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#fff' },

  // Controls
  controls: {
    position: 'absolute', bottom: 250, left: 16, right: 70, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  pinRow:  { flexDirection: 'row', gap: 8 },
  pinDot: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.outlineVariant,
  },
  pinDotFilled:  { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pinNum:        { fontSize: 13, fontWeight: '800', color: Colors.onSurface },
  pinNumFilled:  { color: '#fff' },
  ctrlRow:       { flexDirection: 'row', gap: 8 },
  ctrlBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.94)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },

  // Location FAB
  locFab: {
    position: 'absolute', bottom: 258, right: 16, zIndex: 20,
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },

  // Bottom sheet
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10,
    backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 22, paddingBottom: Platform.OS === 'ios' ? 44 : 28, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 20,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.outlineVariant, alignSelf: 'center', marginBottom: 4 },
  sheetTitle:  { fontSize: 20, fontWeight: '800', color: Colors.onSurface, letterSpacing: -0.3 },
  locRow:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locText:     { fontSize: 13, fontWeight: '600', color: Colors.primary },
  sheetSub:    { fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 19 },

  nameInput: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radii.lg, height: 50, paddingHorizontal: 14,
  },
  nameText:    { flex: 1, fontSize: 15, color: Colors.onSurface },
  areaBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primaryFixed, borderRadius: Radii.lg,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start',
  },
  areaText:    { fontSize: 13, fontWeight: '600', color: Colors.onSurface },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 54, borderRadius: Radii.xxl, gap: 8,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  redrawBtn:   { alignItems: 'center', paddingVertical: 4 },
  redrawText:  { fontSize: 13, color: Colors.outline, fontWeight: '500' },

  // Markers
  markerWrap:   { alignItems: 'center' },
  markerBubble: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  markerNum: { fontSize: 13, fontWeight: '900', color: '#fff' },
  markerTail: {
    width: 0, height: 0,
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: Colors.primary,
  },

  // GPS wait screen
  gpsWait: { flex: 1, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', gap: 16 },
  gpsText: { fontSize: 15, fontWeight: '600', color: Colors.onSurfaceVariant },
});
