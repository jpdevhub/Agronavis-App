import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useFarmer } from '@/hooks/useFarmer';


export default function ProfileScreen() {
  const router = useRouter();
  const signOut = useAuthStore(state => state.signOut);

  const { data: farmer, isLoading: loading } = useFarmer();

  const locationLabel = [farmer?.district, farmer?.state].filter(Boolean).join(', ');

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.iconBtn} />
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.avatarWrap}>
              {farmer?.avatarUrl ? (
                <Image source={{ uri: farmer.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>
                    {(farmer?.fullName ?? 'F').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.name}>{farmer?.fullName ?? ''}</Text>
            <Text style={styles.email}>{farmer?.email ?? ''}</Text>
            {locationLabel ? (
              <View style={styles.locationRow}>
                <MaterialIcons name="location-on" size={15} color={Colors.onSurfaceVariant} />
                <Text style={styles.locationText}>{locationLabel}</Text>
              </View>
            ) : null}
            <TouchableOpacity
              activeOpacity={0.88}
              style={styles.editBtnWrap}
              onPress={() => router.push('/profile/edit' as any)}
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                style={styles.editBtn}
              >
                <Text style={styles.editBtnText}>Edit Profile</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.infoCard}>
            <Row icon="mail-outline" label="Email" value={farmer?.email ?? ''} />
            <Row icon="call" label="Phone" value={farmer?.phone ?? 'Not set'} />
            <Row icon="map" label="State" value={farmer?.state ?? 'Not set'} />
            <Row icon="location-city" label="District" value={farmer?.district ?? 'Not set'} />
            <TouchableOpacity onPress={() => router.push('/profile/security' as never)}>
              <Row
                icon="lock-outline"
                label="Two-step sign in"
                value={farmer?.twoFactorEnabled ? 'On' : 'Off'}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => signOut()}
            activeOpacity={0.85}
          >
            <MaterialIcons name="logout" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>

          <View style={{ height: 100 }} />
        </ScrollView>
      )}
    </View>
  );
}

function Row({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <MaterialIcons name={icon} size={18} color={Colors.primary} style={styles.rowIcon} />
      <View style={styles.rowContent}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.surface },
  loader:       { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: 'rgba(248,249,255,0.95)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  iconBtn:      { padding: 8, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  scroll:       { paddingHorizontal: 20, paddingTop: 24, gap: 16 },

  hero:         { alignItems: 'center', gap: 8 },
  avatarWrap:   { borderRadius: 60, overflow: 'hidden', width: 110, height: 110, shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.1, shadowRadius: 16, elevation: 6 },
  avatar:       { width: 110, height: 110 },
  name:         { fontSize: 26, fontWeight: '900', letterSpacing: -0.6, color: Colors.onSurface, marginTop: 4 },
  email:        { fontSize: 13, color: Colors.onSurfaceVariant },
  locationRow:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 13, color: Colors.onSurfaceVariant },
  editBtnWrap:  { width: '100%', borderRadius: Radii.xl, overflow: 'hidden', marginTop: 4 },
  editBtn:      { alignItems: 'center', justifyContent: 'center', height: 52 },
  editBtnText:  { fontSize: 16, fontWeight: '700', color: Colors.onPrimary },

  infoCard: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl, overflow: 'hidden',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.outlineVariant,
  },
  rowIcon:    { marginRight: 14 },
  rowContent: { flex: 1 },
  rowLabel:   { fontSize: 11, fontWeight: '600', color: Colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowValue:   { fontSize: 15, fontWeight: '500', color: Colors.onSurface, marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: Radii.xl,
    backgroundColor: Colors.errorContainer,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: Colors.error },
  avatarFallback: {
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 34, fontWeight: '600', color: Colors.onSecondaryContainer },
});
