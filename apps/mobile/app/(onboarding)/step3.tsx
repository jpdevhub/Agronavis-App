import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  StatusBar, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

type NotifItem = {
  id: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  desc: string;
};

const NOTIFICATIONS: NotifItem[] = [
  { id: 'weather',  icon: 'wb-sunny',    title: 'Weather Alerts',     desc: 'Frost, storm, and rain warnings for your region' },
  { id: 'tasks',    icon: 'event-note',  title: 'Task Reminders',     desc: 'Irrigation, fertilizer, and harvest schedules' },
  { id: 'pests',    icon: 'bug-report',  title: 'Pest & Disease',     desc: 'Early warnings from your community network' },
  { id: 'market',   icon: 'trending-up', title: 'Market Prices',      desc: 'Live mandi price updates for your crops' },
];

export default function OnboardingStep3() {
  const router = useRouter();
  const [enabled, setEnabled] = useState<Record<string, boolean>>({
    weather: true, tasks: true, pests: false, market: false,
  });

  const toggle = (id: string) => setEnabled(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.brand}>Agronavis</Text>
        <View style={styles.w38} />
      </View>

      {/* Progress */}
      <View style={styles.progressWrap}>
        <View style={styles.progressRow}>
          <Text style={styles.stepLabel}>Step 3 of 3</Text>
          <Text style={styles.stepSub}>Notifications</Text>
        </View>
        <View style={styles.progressTrack}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.progressFill}
          />
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="notifications-active" size={48} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Stay Informed</Text>
        <Text style={styles.subtitle}>
          Choose which alerts you want to receive. You can always change this later in Settings.
        </Text>

        <View style={styles.list}>
          {NOTIFICATIONS.map(item => (
            <View key={item.id} style={styles.row}>
              <View style={[styles.iconBox, enabled[item.id] && styles.iconBoxActive]}>
                <MaterialIcons
                  name={item.icon}
                  size={22}
                  color={enabled[item.id] ? Colors.primary : Colors.outline}
                />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowDesc}>{item.desc}</Text>
              </View>
              <Switch
                value={enabled[item.id]}
                onValueChange={() => toggle(item.id)}
                trackColor={{ false: Colors.surfaceContainerHigh, true: Colors.primaryFixed }}
                thumbColor={enabled[item.id] ? Colors.primary : Colors.outline}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/dashboard')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryContainer]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.finishGradient}
          >
            <Text style={styles.finishText}>Get Started</Text>
            <MaterialIcons name="check" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/dashboard')} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12,
  },
  backBtn:       { padding: 8, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh },
  brand:         { fontSize: 20, fontWeight: '900', color: Colors.primary },
  w38:           { width: 38 },
  progressWrap:  { paddingHorizontal: 24, marginBottom: 8 },
  progressRow:   { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  stepLabel:     { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  stepSub:       { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  progressTrack: { height: 8, backgroundColor: Colors.surfaceContainerHigh, borderRadius: 4, overflow: 'hidden' },
  progressFill:  { width: '100%', height: '100%', borderRadius: 4 },
  content:       { flex: 1, paddingHorizontal: 24 },
  iconWrap: {
    width: 88, height: 88, borderRadius: Radii.xl,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginTop: 16, marginBottom: 16,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 4,
  },
  title:         { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: Colors.onSurface, textAlign: 'center', marginBottom: 8 },
  subtitle:      { fontSize: 14, color: Colors.onSurfaceVariant, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  list:          { gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surfaceContainerLowest, borderRadius: Radii.xl,
    padding: 16,
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: Radii.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxActive: { backgroundColor: Colors.primaryFixed },
  rowText:       { flex: 1 },
  rowTitle:      { fontSize: 15, fontWeight: '700', color: Colors.onSurface },
  rowDesc:       { fontSize: 12, color: Colors.onSurfaceVariant, marginTop: 2, lineHeight: 16 },
  footer:        { padding: 24, paddingBottom: 40, gap: 12 },
  finishGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: Radii.xxl, gap: 8,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  finishText:    { fontSize: 17, fontWeight: '700', color: '#fff' },
  skipBtn:       { alignItems: 'center', paddingVertical: 8 },
  skipText:      { fontSize: 14, color: Colors.outline, fontWeight: '500' },
});
