import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';
import { useState } from 'react';

type SettingRow = { id: string; icon: React.ComponentProps<typeof MaterialIcons>['name']; title: string; sub: string; toggle?: boolean };
const SETTINGS: SettingRow[] = [
  { id: 'auto_sync', icon: 'sync',            title: 'Auto-Sync Satellite',    sub: 'Update imagery every 6 hours',       toggle: true  },
  { id: 'gps',       icon: 'gps-fixed',        title: 'High-Accuracy GPS',      sub: 'Use device GPS for mapping',         toggle: true  },
  { id: 'alerts',    icon: 'notifications',    title: 'Field Alerts',           sub: 'Notify on boundary changes',         toggle: false },
  { id: 'export',    icon: 'file-download',    title: 'Export Field Data',      sub: 'Download CSV or GeoJSON',            toggle: false },
  { id: 'units',     icon: 'straighten',       title: 'Measurement Units',      sub: 'Acres / Hectares',                   toggle: false },
];

export default function MappingSettingsScreen() {
  const router = useRouter();
  const [toggles, setToggles] = useState<Record<string, boolean>>({ auto_sync: true, gps: true, alerts: false });
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mapping Settings</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={styles.list}>
        {SETTINGS.map(item => (
          <View key={item.id} style={styles.row}>
            <View style={styles.iconBox}>
              <MaterialIcons name={item.icon} size={20} color={Colors.primary} />
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowTitle}>{item.title}</Text>
              <Text style={styles.rowSub}>{item.sub}</Text>
            </View>
            {item.toggle ? (
              <Switch
                value={!!toggles[item.id]}
                onValueChange={() => setToggles(p => ({ ...p, [item.id]: !p[item.id] }))}
                trackColor={{ false: Colors.surfaceContainerHigh, true: Colors.primaryFixed }}
                thumbColor={toggles[item.id] ? Colors.primary : Colors.outline}
              />
            ) : (
              <MaterialIcons name="chevron-right" size={20} color={Colors.outline} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: 'rgba(248,249,255,0.95)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  backBtn:     { padding: 8, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  list:        { padding: 20, gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xl, padding: 16,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  iconBox:     { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.primaryFixed, alignItems: 'center', justifyContent: 'center' },
  rowBody:     { flex: 1 },
  rowTitle:    { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  rowSub:      { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2 },
});
