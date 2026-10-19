import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing } from '@/constants/theme';
import { TwoFactorVerify } from '@/features/auth/TwoFactorVerify';
import { useAuthStore } from '@/store/useAuthStore';

export default function TwoFactorScreen() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);

  // Without this the panel starts at pixel zero, which on a phone with a
  // notch or a tall status bar puts the heading behind the clock.
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.sm }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <TwoFactorVerify
        onVerified={() => router.replace('/(tabs)/dashboard')}
        onCancel={async () => {
          await signOut();
          router.replace('/(auth)/welcome');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.surface } });
