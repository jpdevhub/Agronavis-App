import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + Spacing.xxxl, paddingBottom: insets.bottom + Spacing.xxl },
        ]}
      >
        <View style={styles.brand}>
          <View style={styles.mark}>
            <MaterialIcons name="eco" size={56} color={Colors.primary} />
          </View>
          <Text style={styles.appName}>Agronavis</Text>
          <Text style={styles.tagline}>The precision horizon for modern agriculture.</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push('/(auth)/register')}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnPrimaryText}>Get Started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.88}
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
  root: { flex: 1, backgroundColor: Colors.onPrimaryContainer },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
    gap: Spacing.xxxl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },

  brand: { alignItems: 'center', gap: Spacing.md },
  mark: {
    width: 104,
    height: 104,
    borderRadius: Shape.extraExtraLarge,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: { ...TypeEmphasized.displaySmall, color: '#fff', marginTop: Spacing.sm },
  tagline: {
    ...Type.bodyLarge,
    color: Colors.primaryFixedDim,
    textAlign: 'center',
    maxWidth: 300,
  },

  actions: { gap: Spacing.md },
  btnPrimary: {
    height: 60,
    borderRadius: Shape.full,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimaryText: { ...TypeEmphasized.titleMedium, color: Colors.onPrimaryContainer },
  btnSecondary: {
    height: 60,
    borderRadius: Shape.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSecondaryText: { ...TypeEmphasized.titleMedium, color: '#fff' },
});
