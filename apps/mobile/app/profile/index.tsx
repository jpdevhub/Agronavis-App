import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

const AVATAR_URL = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80';

const STATS = [
  { label: 'Total Acreage', value: '1,240', unit: 'ac',      span: 2, icon: 'landscape' as const },
  { label: 'Active Crops',  value: 'Wheat, Soy', unit: '',   span: 1, icon: 'eco' as const },
  { label: 'Soil Health',   value: '92%',         unit: '',  span: 1, icon: 'science' as const },
];

const CERTS = [
  { icon: 'verified' as const, title: 'Organic Certified', sub: 'Valid until Dec 2025' },
  { icon: 'handshake' as const, title: 'Fair Trade',        sub: 'Verified Partner' },
];

export default function ProfileScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => router.push('/(tabs)/farm/settings' as any)}
        >
          <MaterialIcons name="settings" size={22} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile hero */}
        <View style={styles.hero}>
          <View style={styles.avatarWrap}>
            <Image source={{ uri: AVATAR_URL }} style={styles.avatar} />
            <TouchableOpacity style={styles.editAvatarBtn}>
              <MaterialIcons name="edit" size={14} color={Colors.onPrimary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.name}>Rajesh Kumar</Text>
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={15} color={Colors.onSurfaceVariant} />
            <Text style={styles.locationText}>Region: Northern Plains</Text>
          </View>
          <TouchableOpacity activeOpacity={0.88} style={styles.editBtnWrap}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              style={styles.editBtn}
            >
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Farm Stats */}
        <Text style={styles.sectionTitle}>Farm Stats</Text>
        <View style={styles.statsGrid}>
          {/* Wide card */}
          <View style={[styles.statCard, styles.statCardWide]}>
            <View style={styles.statRow}>
              <View>
                <Text style={styles.statLabel}>{STATS[0].label}</Text>
                <Text style={styles.statValue}>
                  {STATS[0].value}
                  <Text style={styles.statUnit}> {STATS[0].unit}</Text>
                </Text>
              </View>
              <MaterialIcons name={STATS[0].icon} size={32} color={Colors.primaryContainer} />
            </View>
          </View>
          {/* Two half cards */}
          {STATS.slice(1).map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <Text style={styles.statLabel}>{stat.label}</Text>
              {stat.label === 'Soil Health' ? (
                <>
                  <Text style={[styles.statValue, { color: Colors.primary }]}>{stat.value}</Text>
                  <View style={styles.healthTrack}>
                    <View style={[styles.healthFill, { width: '92%' }]} />
                  </View>
                </>
              ) : (
                <Text style={styles.statValue}>{stat.value}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Certifications */}
        <Text style={styles.sectionTitle}>Certifications</Text>
        <View style={styles.certsList}>
          {CERTS.map(cert => (
            <View key={cert.title} style={styles.certRow}>
              <View style={styles.certIcon}>
                <MaterialIcons name={cert.icon} size={22} color={Colors.onSecondaryContainer} />
              </View>
              <View>
                <Text style={styles.certTitle}>{cert.title}</Text>
                <Text style={styles.certSub}>{cert.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => router.replace('/(auth)/welcome')}
          activeOpacity={0.85}
        >
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
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
  settingsBtn:    { padding: 8, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh },
  scroll:         { paddingHorizontal: 20, paddingTop: 24, gap: 14 },

  hero:           { alignItems: 'center', gap: 10 },
  avatarWrap:     { position: 'relative' },
  avatar: {
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 4, borderColor: Colors.surfaceContainerLowest,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1, shadowRadius: 20, elevation: 6,
  },
  editAvatarBtn: {
    position: 'absolute', bottom: 2, right: 2, width: 28, height: 28,
    borderRadius: 14, backgroundColor: Colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  name:           { fontSize: 28, fontWeight: '900', letterSpacing: -0.6, color: Colors.onSurface },
  locationRow:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText:   { fontSize: 14, color: Colors.onSurfaceVariant },
  editBtnWrap:    { width: '100%', borderRadius: Radii.xl, overflow: 'hidden' },
  editBtn:        { alignItems: 'center', justifyContent: 'center', height: 52 },
  editBtnText:    { fontSize: 16, fontWeight: '700', color: Colors.onPrimary },

  sectionTitle:   { fontSize: 18, fontWeight: '800', color: Colors.onSurface, marginTop: 8 },

  statsGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    flex: 1, minWidth: '46%', backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl, padding: 18, gap: 6,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  statCardWide:   { minWidth: '100%', flexBasis: '100%' },
  statRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  statLabel:      { fontSize: 12, color: Colors.onSurfaceVariant, fontWeight: '600' },
  statValue:      { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, color: Colors.onSurface },
  statUnit:       { fontSize: 14, fontWeight: '400', color: Colors.onSurfaceVariant },
  healthTrack:    { height: 6, backgroundColor: Colors.surfaceContainer, borderRadius: 3, overflow: 'hidden' },
  healthFill:     { height: '100%', backgroundColor: Colors.primary, borderRadius: 3 },

  certsList:      { gap: 10 },
  certRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surfaceContainerLow, borderRadius: Radii.xl, padding: 16,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  certIcon: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: Colors.secondaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  certTitle:      { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  certSub:        { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: Radii.xl,
    backgroundColor: Colors.errorContainer, marginTop: 8,
  },
  logoutText:     { fontSize: 15, fontWeight: '700', color: Colors.error },
});
