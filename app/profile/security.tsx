import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useGoBack } from '@/hooks/useGoBack';
import { Colors } from '@/constants/theme';
import { TwoFactorSetup } from '@/features/auth/TwoFactorSetup';

export default function SecurityScreen() {
  const router = useRouter();
  const goBack = useGoBack('/profile');
  return (
    <View style={styles.root}>
      <TwoFactorSetup onDone={() => goBack()} />
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: Colors.surface } });
