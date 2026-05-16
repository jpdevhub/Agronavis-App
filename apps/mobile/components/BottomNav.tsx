import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';

type TabItem = {
  segment: string;
  path: string;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
};

const TABS: TabItem[] = [
  { segment: 'dashboard', path: '/(tabs)/dashboard', label: 'Dashboard', icon: 'dashboard' },
  { segment: 'farm',      path: '/(tabs)/farm',      label: 'My Farms',  icon: 'agriculture' },
  { segment: 'scan',      path: '/(tabs)/scan',      label: 'AI Scanner',icon: 'photo-camera' },
  { segment: 'community', path: '/(tabs)/community', label: 'Community', icon: 'groups' },
];

export default function BottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  const activeSegment = TABS.find(t => pathname.includes(`/${t.segment}`))?.segment ?? '';

  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = activeSegment === tab.segment;
        return (
          <TouchableOpacity
            key={tab.segment}
            onPress={() => router.push(tab.path as any)}
            style={styles.btn}
            activeOpacity={0.75}
          >
            {isActive ? (
              <LinearGradient
                colors={[Colors.primary, Colors.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.pill}
              >
                <MaterialIcons name={tab.icon} size={20} color="#fff" />
                <Text style={styles.pillLabel}>{tab.label}</Text>
              </LinearGradient>
            ) : (
              <View style={styles.inactiveItem}>
                <MaterialIcons name={tab.icon} size={22} color={Colors.outline} />
                <Text style={styles.inactiveLabel}>{tab.label}</Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 28,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#0b1c30',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 20,
  },
  btn: { flex: 1, alignItems: 'center' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  pillLabel:     { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  inactiveItem:  { alignItems: 'center', gap: 3 },
  inactiveLabel: { color: Colors.outline, fontSize: 10, fontWeight: '600', letterSpacing: 0.2, marginTop: 2 },
});
