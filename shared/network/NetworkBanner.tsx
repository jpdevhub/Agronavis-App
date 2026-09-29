import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shape, Spacing, Type } from '@/constants/theme';
import { useConnectivity } from './ConnectivityProvider';

const COPY = {
  offline: { icon: 'cloud-off' as const, text: 'Offline. Your changes will sync when you reconnect.' },
  degraded: { icon: 'signal-wifi-statusbar-connected-no-internet-4' as const, text: 'Connected, but the internet is not reachable.' },
};

/** Sits under the status bar whenever the connection is not usable. */
export function NetworkBanner() {
  const { status } = useConnectivity();
  const insets = useSafeAreaInsets();
  if (status === 'online') return null;

  const { icon, text } = COPY[status];
  return (
    <View style={[styles.banner, { paddingTop: insets.top + Spacing.sm }]}>
      <MaterialIcons name={icon} size={18} color={Colors.onTertiaryContainer} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm,
    backgroundColor: Colors.tertiaryFixed,
    borderBottomLeftRadius: Shape.large, borderBottomRightRadius: Shape.large,
  },
  text: { ...Type.bodySmall, color: Colors.onTertiaryContainer, flex: 1 },
});
