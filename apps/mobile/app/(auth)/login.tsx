import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

/**
 * Login Screen
 * TODO: Implement Clerk sign-in flow with OTP/email
 */
export default function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌾 Agronavis</Text>
      <Text style={styles.subtitle}>Login Screen</Text>
      <Text style={styles.note}>Clerk sign-in integration coming here</Text>
      <Link href="/(tabs)/dashboard" style={styles.link}>
        → Go to Dashboard (dev bypass)
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0E3D1F', gap: 12 },
  title: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 18, color: '#A8D5B5' },
  note: { fontSize: 12, color: '#6B9F7E' },
  link: { marginTop: 20, color: '#4CAF50', fontSize: 16 },
});
