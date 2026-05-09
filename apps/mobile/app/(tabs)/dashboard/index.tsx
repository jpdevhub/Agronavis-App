import { View, Text, StyleSheet } from 'react-native';

/**
 * Dashboard Screen
 * TODO: Farm overview, weather widget, quick actions, advisory summary
 */
export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>Farm overview coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A2B15' },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#6B9F7E', marginTop: 8 },
});
