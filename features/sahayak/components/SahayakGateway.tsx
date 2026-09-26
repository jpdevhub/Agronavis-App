import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Shape, Spacing, TypeEmphasized } from '@/constants/theme';
import { Env } from '@/constants/env';
import { FLOATING_BAR_HEIGHT } from '@/components/navigation/FloatingTabBar';
import { SahayakSheet } from './SahayakSheet';

/** Height of the Sahayak pill plus its gap, for screens with their own FAB. */
export const SAHAYAK_FAB_SPACE = 56 + Spacing.md;

/** Floating entry point to Sahayak, above the tab bar on every tab. */
export function SahayakGateway() {
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false);
  const insets = useSafeAreaInsets();

  if (!Env.features.sahayak) return null;

  const bottom = FLOATING_BAR_HEIGHT + insets.bottom + Spacing.md;

  return (
    <>
      <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
        <Pressable
          onPress={() => {
            setEverOpened(true);
            setOpen(true);
          }}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Ask Sahayak"
        >
          <MaterialIcons name="forum" size={22} color={Colors.onPrimaryContainer} />
          <Text style={styles.label}>Sahayak</Text>
        </Pressable>
      </View>

      {everOpened && <SahayakSheet visible={open} onClose={() => setOpen(false)} />}
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: Spacing.xl, alignItems: 'flex-end' },
  fab: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    height: 56, paddingHorizontal: Spacing.xl,
    borderRadius: Shape.full, backgroundColor: Colors.primaryFixed,
    ...Elevation.level3,
  },
  label: { ...TypeEmphasized.titleMedium, color: Colors.onPrimaryContainer },
});
