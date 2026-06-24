import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ImageBackground, StyleSheet, Text, View, TouchableOpacity, StatusBar, Platform } from 'react-native';

import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

const FIELD_IMAGE = { uri: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800&q=80' };

export default function WelcomeScreen() {
  const router = useRouter();

  // Micro-animation for primary CTA


  // ── Web layout: centred card over a full-bleed hero image ─────────────────
  if (Platform.OS === 'web') {
    return (
      <View style={styles.rootWeb}>
        <StatusBar barStyle="light-content" />
        <ImageBackground source={FIELD_IMAGE} style={StyleSheet.absoluteFill} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(11,28,48,0.45)', 'rgba(11,28,48,0.75)']}
          style={StyleSheet.absoluteFill}
        />

        {/* Centred content column */}
        <View style={styles.webCenter}>
          <View style={styles.webCard}>
            {/* Brand */}
            <View style={styles.webBrand}>
              <View style={styles.iconBadge}>
                <MaterialIcons name="eco" size={40} color={Colors.primary} />
              </View>
              <Text style={styles.webAppName}>Agronavis</Text>
              <Text style={styles.webTagline}>The precision horizon for modern agriculture.</Text>
            </View>

            {/* CTAs */}
            <View style={styles.webActions}>
              <TouchableOpacity activeOpacity={0.88} onPress={() => router.push('/(auth)/register')}>
                <LinearGradient
                  colors={[Colors.primary, Colors.primaryContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.btnPrimary}
                >
                  <Text style={styles.btnPrimaryText}>Get Started</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push('/(auth)/login')}
                style={styles.btnSecondaryWeb}
              >
                <Text style={styles.btnSecondaryText}>Log In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ── Native layout (original, unchanged) ────────────────────────────────────
  return (
    <View style={styles.root}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      <ImageBackground source={FIELD_IMAGE} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <LinearGradient
        colors={['transparent', 'rgba(11,28,48,0.55)', Colors.surface]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        <View style={styles.brand}>
          <View style={styles.iconBadge}>
            <MaterialIcons name="eco" size={40} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>Agronavis</Text>
          <Text style={styles.tagline}>The precision horizon for modern agriculture.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity activeOpacity={1} onPress={() => router.push('/(auth)/register')}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnPrimary}
            >
              <Text style={styles.btnPrimaryText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={1}
            onPress={() => router.push('/(auth)/login')}
            style={styles.btnSecondary}
          >
            <Text style={styles.btnSecondaryText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Native ────────────────────────────────────────────────────────────────
  root: { flex: 1, backgroundColor: Colors.surface },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 56,
    gap: 48,
  },
  brand: { alignItems: 'center', gap: 12 },
  iconBadge: {
    width: 80,
    height: 80,
    borderRadius: Radii.xl,
    backgroundColor: 'rgba(248,249,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0b1c30',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  appName: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -1.5,
    color: Colors.onSurface,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 260,
  },
  actions: { width: '100%', gap: 12 },
  btnPrimary: {
    width: '100%',
    height: 56,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  btnPrimaryText: { fontSize: 17, fontWeight: '700', color: Colors.onPrimary, letterSpacing: 0.2 },
  btnSecondary: {
    width: '100%',
    height: 56,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  btnSecondaryText: { fontSize: 17, fontWeight: '700', color: Colors.onSurface, letterSpacing: 0.2 },

  // ── Web ───────────────────────────────────────────────────────────────────
  rootWeb: {
    flex: 1,
    minHeight: '100vh' as any,
    backgroundColor: '#0b1c30',
  },
  webCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh' as any,
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  webCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: 'rgba(248,249,255,0.94)',
    borderRadius: 32,
    padding: 48,
    gap: 36,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.25,
    shadowRadius: 48,
  },
  webBrand: { alignItems: 'center', gap: 14 },
  webAppName: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1.5,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  webTagline: {
    fontSize: 16,
    fontWeight: '400',
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  webActions: { width: '100%', gap: 12 },
  btnSecondaryWeb: {
    width: '100%',
    height: 56,
    borderRadius: Radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
  },
});
