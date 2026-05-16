import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';

// Verification is handled server-side — this screen redirects to dashboard.
export default function VerifyScreen() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => router.replace('/(tabs)/dashboard'), 500);
    return () => clearTimeout(t);
  }, []);
  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
});
