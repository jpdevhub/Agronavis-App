import { View, Text, StyleSheet } from 'react-native';

/**
 * Crops Screen
 * TODO: Crop tracking, growth stages, disease alerts, scan integration
 */
export default function CropsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Crops</Text>
      <Text style={styles.subtitle}>Crop monitoring coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A2B15' },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#6B9F7E', marginTop: 8 },
});
