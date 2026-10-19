import { View, StyleSheet, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/useGoBack';
import { Colors, Spacing } from '@/constants/theme';
import { TwoFactorSetup } from '@/features/auth/TwoFactorSetup';

export default function SecurityScreen() {
  const router = useRouter();
  const goBack = useGoBack('/profile');
  // Without this the panel starts at pixel zero, which on a phone with a
  // notch or a tall status bar puts the heading behind the clock.
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top + Spacing.sm }]}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <TwoFactorSetup onDone={() => goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.surface } });
