import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { TwoFactorSetup } from '@/features/auth/TwoFactorSetup';

export default function SecurityScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <TwoFactorSetup onDone={() => router.back()} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.surface } });
