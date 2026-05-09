import { View, Text, StyleSheet } from 'react-native';

/**
 * Advisory Screen
 * TODO: AI-generated advisories, weather alerts, pest warnings, scheme info
 */
export default function AdvisoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Advisory</Text>
      <Text style={styles.subtitle}>AI farm advisories coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A2B15' },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#6B9F7E', marginTop: 8 },
});
