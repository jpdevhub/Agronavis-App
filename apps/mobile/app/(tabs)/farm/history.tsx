import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

const HISTORY = [
  { id: '1', date: 'Oct 24, 2024', action: 'Field boundary updated', field: 'North Plot', icon: 'edit-location-alt' as const },
  { id: '2', date: 'Oct 21, 2024', action: 'New field mapped',       field: 'East Block',  icon: 'add-location-alt' as const },
  { id: '3', date: 'Oct 18, 2024', action: 'Soil sample recorded',   field: 'South Field', icon: 'science' as const },
  { id: '4', date: 'Oct 10, 2024', action: 'Satellite image synced', field: 'North Plot',  icon: 'satellite-alt' as const },
  { id: '5', date: 'Oct 5, 2024',  action: 'Irrigation mapped',      field: 'East Block',  icon: 'water' as const },
];

export default function MappingHistoryScreen() {
  const router = useRouter();
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapping History</Text>
        <View style={{ width: 38 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {HISTORY.map(item => (
          <View key={item.id} style={styles.row}>
            <View style={styles.iconBox}>
              <MaterialIcons name={item.icon} size={22} color={Colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowAction}>{item.action}</Text>
              <Text style={styles.rowField}>{item.field}</Text>
            </View>
            <Text style={styles.rowDate}>{item.date}</Text>
          </View>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: 'rgba(248,249,255,0.95)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  backBtn:      { padding: 8, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh },
  headerTitle:  { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  scroll:       { padding: 20, gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xl, padding: 16,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  iconBox:      { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  rowBody:      { flex: 1 },
  rowAction:    { fontSize: 14, fontWeight: '700', color: Colors.onSurface },
  rowField:     { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
  rowDate:      { fontSize: 11, color: Colors.outline, fontWeight: '600' },
});
