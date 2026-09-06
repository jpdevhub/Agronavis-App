import { useCallback, useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PestAlertEvent } from '@agronavis/shared-types';
import { Colors, Elevation, Shape, Spacing, Type } from '@/constants/theme';

const VISIBLE_MS = 8000;

interface PestAlertBannerProps {
  alert: PestAlertEvent | null;
  onDismiss: () => void;
  onViewDetails?: (alert: PestAlertEvent) => void;
}

/** Slides in when a scan nearby detects a disease, and retreats on its own. */
export function PestAlertBanner({ alert, onDismiss, onViewDetails }: PestAlertBannerProps) {
  const insets = useSafeAreaInsets();
  const offset = useRef(new Animated.Value(-200)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(offset, {
      toValue: -200,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) onDismiss();
    });
  }, [offset, onDismiss]);

  useEffect(() => {
    if (!alert) return;

    Animated.spring(offset, {
      toValue: 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 180,
    }).start();

    timer.current = setTimeout(hide, VISIBLE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [alert, offset, hide]);

  if (!alert) return null;

  const confidence = Math.round(alert.confidence * 100);

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.sm, transform: [{ translateY: offset }] },
      ]}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="pest-control" size={22} color={Colors.onError} />
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1}>
            {alert.disease} detected nearby
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            Reported in {alert.district} at {confidence}% confidence. Check your crop today.
          </Text>

          {onViewDetails ? (
            <Pressable
              onPress={() => {
                hide();
                onViewDetails(alert);
              }}
              accessibilityRole="button"
              style={styles.action}
            >
              <Text style={styles.actionLabel}>View details</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable onPress={hide} accessibilityRole="button" accessibilityLabel="Dismiss" hitSlop={12}>
          <MaterialIcons name="close" size={20} color={Colors.onErrorContainer} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    backgroundColor: Colors.errorContainer,
    borderBottomLeftRadius: Shape.extraLarge,
    borderBottomRightRadius: Shape.extraLarge,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    ...Elevation.level3,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Shape.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  title: { ...Type.titleSmall, color: Colors.onErrorContainer },
  message: { ...Type.bodySmall, color: Colors.onErrorContainer, opacity: 0.86 },
  action: { marginTop: Spacing.sm, alignSelf: 'flex-start' },
  actionLabel: { ...Type.labelLarge, color: Colors.error, textDecorationLine: 'underline' },
});
