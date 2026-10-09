import { ImageBackground, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';

/**
 * First screen. A photograph of produce rather than a colour field: this is the
 * only moment before sign-in to say what the app is for, and a picture of the
 * harvest says it faster than the tagline underneath does.
 *
 * Bundled rather than fetched, so it renders with no network and no
 * third-party host — which is the state a good share of first launches are in.
 */
const FIELD_IMAGE = require('@/assets/images/agronavis.png');

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <ImageBackground source={FIELD_IMAGE} style={StyleSheet.absoluteFill} resizeMode="cover">
        {/* A flat scrim, not a gradient. The photograph is busy and the text
            has to hold 4.5:1 over whatever part of it happens to sit behind. */}
        <View style={styles.scrim} />
      </ImageBackground>

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + Spacing.xxxl, paddingBottom: insets.bottom + Spacing.xxl },
        ]}
      >
        <View style={styles.brand}>
          <View style={styles.mark}>
            <MaterialIcons name="eco" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>Agronavis</Text>
          <Text style={styles.tagline}>The precision horizon for modern agriculture.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push('/(auth)/register')}
            style={styles.btnPrimary}
            accessibilityRole="button"
          >
            <Text style={styles.btnPrimaryText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push('/(auth)/login')}
            style={styles.btnSecondary}
            accessibilityRole="button"
          >
            <Text style={styles.btnSecondaryText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.onPrimaryContainer },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(8,26,18,0.58)' },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'flex-end',
    gap: Spacing.xxxl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  brand: { alignItems: 'center', gap: Spacing.md },
  mark: {
    width: 88,
    height: 88,
    borderRadius: Shape.extraExtraLarge,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { ...TypeEmphasized.displaySmall, color: '#fff', marginTop: Spacing.sm },
  tagline: {
    ...Type.bodyLarge,
    color: 'rgba(255,255,255,0.88)',
    textAlign: 'center',
    maxWidth: 300,
  },

  actions: { gap: Spacing.md, paddingBottom: Spacing.xxl },
  // One solid green, not two blended into each other.
  btnPrimary: {
    height: 60,
    borderRadius: Shape.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { ...TypeEmphasized.titleMedium, color: '#fff' },
  btnSecondary: {
    height: 60,
    borderRadius: Shape.full,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
});
