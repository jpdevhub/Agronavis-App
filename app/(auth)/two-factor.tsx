import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { TwoFactorVerify } from '@/features/auth/TwoFactorVerify';
import { useAuthStore } from '@/store/useAuthStore';

export default function TwoFactorScreen() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);

  return (
    <View style={styles.root}>
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
