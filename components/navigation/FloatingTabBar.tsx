import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Elevation, Motion, Shape, Spacing, TypeEmphasized } from '@/constants/theme';

type IconName = React.ComponentProps<typeof MaterialIcons>['name'];

/** Pill height plus the padding around it, excluding the safe-area inset. */
export const FLOATING_BAR_HEIGHT = 48 + Spacing.sm * 2 + Spacing.md;

/**
 * M3 Expressive navigation bar: a floating pill detached from the screen edge.
 * Only the active destination carries a label, inside its own filled pill.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom + Spacing.md, pointerEvents: 'box-none' }]}>
      {/*
        The strip the content scrolls behind. Without it a card sliding under
        the bar stayed perfectly legible right down to the system navigation,
        which reads as a layout fault rather than depth — the bar looked like
        it was floating over a bug. Frosted, the content clearly passes
        beneath something.

        Android needs the Dimezis path to blur at all; where it is unavailable
        the view falls back to its own translucent background, which still
        softens what is behind it rather than failing open to nothing.
      */}
      <BlurView
        intensity={Platform.OS === 'android' ? 24 : 32}
        tint="light"
        experimentalBlurMethod="dimezisBlurView"
        style={[StyleSheet.absoluteFill, styles.scrim]}
      />
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = (options.title ?? route.name) as string;
          const icon = (options as { tabBarIconName?: IconName }).tabBarIconName;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };

          return (
            <TabItem
              key={route.key}
              icon={icon ?? 'circle'}
              label={label}
              focused={focused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({
  icon, label, focused, onPress,
}: { icon: IconName; label: string; focused: boolean; onPress: () => void }) {
  const grow = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(grow, {
      toValue: focused ? 1 : 0,
      useNativeDriver: false,
      ...Motion.spatialDefault,
    }).start();
  }, [focused, grow]);

  const paddingHorizontal = grow.interpolate({ inputRange: [0, 1], outputRange: [Spacing.lg, Spacing.xl] });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.item, focused && styles.itemActive, { paddingHorizontal }]}>
        <MaterialIcons
          name={icon}
          size={24}
          color={focused ? Colors.onPrimary : Colors.onSurfaceVariant}
        />
        {focused && <Text style={styles.label} numberOfLines={1}>{label}</Text>}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  scrim: {
    // Tints the frost toward the app's surface and stands in for the blur
    // entirely on a device that cannot do one. Never fully opaque: the point
    // is that content is visible but clearly behind.
    backgroundColor: 'rgba(248, 249, 255, 0.72)',
    pointerEvents: 'none',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: Shape.full,
    // Neutral chrome, one accent: the bar recedes, the active pill carries the
    // colour. A tinted bar plus a tinted pill is two competing greens.
    backgroundColor: Colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    ...Elevation.level2,
  },
  item: {
    height: 48,
    // Fixed rather than a minimum: the active pill grows to fit its label, and
    // a flexible inactive item gave that growth away from the icons. With a
    // long title like "Community" the three unselected icons were squeezed
    // into the left third of the bar.
    width: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    borderRadius: Shape.full,
  },
  itemActive: {
    backgroundColor: Colors.primary,
    width: 'auto',
    paddingHorizontal: Spacing.lg,
    // Never more than the bar can spare; the label shrinks before the row
    // starts overflowing.
    maxWidth: '46%',
  },
  label: { ...TypeEmphasized.labelLarge, color: Colors.onPrimary, flexShrink: 1 },
});
