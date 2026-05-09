import { View, Text, StyleSheet } from 'react-native';

/**
 * Farm Management Screen
 * TODO: Farm CRUD, field mapping, IoT device status
 */
export default function FarmScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Farm</Text>
      <Text style={styles.subtitle}>Farm management coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A2B15' },
  title: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#6B9F7E', marginTop: 8 },
});
