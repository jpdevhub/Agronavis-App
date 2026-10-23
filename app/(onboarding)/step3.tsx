import { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar, Switch, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import { useGoBack } from '@/hooks/useGoBack';
import { MaterialIcons } from '@expo/vector-icons';
import type { AlertCategory, AlertPreferences } from '@agronavis/shared-types';
import { ALERT_CATEGORIES } from '@/constants/alerts';
import { Colors, Radii, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { showAlert } from '@/utils/alert';
import { useAuthStore } from '@/store/useAuthStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { farmerApi } from '@/services/endpoints';
import { Loader } from '@/components/ui';

/**
 * One row per alert the app genuinely sends.
 *
 * This list used to offer Task Reminders and Market Prices, which nothing
 * produces, and threw every answer away on Finish — four switches wired to
 * nothing. These three are the advisory categories the jobs actually create,
 * and the choice is saved to the profile and read by the server before it
 * pushes.
 */
const ALERTS: Record<AlertCategory, {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  desc: string;
}> = {
  weather_alert: {
    icon: 'thunderstorm',
    title: 'Weather warnings',
    desc: 'Storms, heavy rain, frost and heat over your fields',
  },
  irrigation: {
    icon: 'water-drop',
    title: 'Irrigation',
    desc: 'When the root zone is running dry, and when rain means waiting',
  },
  pest_control: {
    icon: 'coronavirus',
    title: 'Pest and disease',
    desc: 'Conditions that bring fungal disease, and smoke drifting your way',
  },
};

export default function OnboardingStep3() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const goBack = useGoBack('/(onboarding)/step2');
  const user = useAuthStore((s) => s.user);
  const { state, district, reset } = useOnboardingStore();
  const [finishing, setFinishing] = useState(false);
  const [blockedBySystem, setBlockedBySystem] = useState(false);
  const [enabled, setEnabled] = useState<AlertPreferences>(
    () => Object.fromEntries(ALERT_CATEGORIES.map((c) => [c, true])) as AlertPreferences,
  );

  // A switch that promises an alert Android will never deliver is the same
  // lie in a different place, so say it here.
  useEffect(() => {
    let cancelled = false;
    void Notifications.getPermissionsAsync().then((p) => {
      if (!cancelled) setBlockedBySystem(!p.granted);
    });
    return () => { cancelled = true; };
  }, []);

  const toggle = (id: AlertCategory) =>
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));

  async function finish(withPreferences: boolean) {
    if (!user || finishing) return;
    setFinishing(true);
    try {
      await farmerApi.update({
        onboardingComplete: true,
        ...(withPreferences ? { alertPreferences: enabled } : {}),
        ...(state ? { state } : {}),
        ...(district ? { district } : {}),
      });
      reset();
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      setFinishing(false);
      showAlert('Could not save', (err as Error)?.message ?? 'Please try again.');
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          onPress={() => goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.brand}>Agronavis</Text>
        <View style={styles.w38} />
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressRow}>
          <Text style={styles.stepLabel}>Final step</Text>
          <Text style={styles.stepSub}>Alerts</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={styles.progressFull} />
        </View>
      </View>

      {/* Was a fixed View, so on a short screen the last switch and the
          button below it were simply unreachable. */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconWrap}>
          <MaterialIcons name="notifications-active" size={44} color={Colors.primary} />
        </View>
        <Text style={styles.title}>What should we tell you about?</Text>
        <Text style={styles.subtitle}>
          Only when something needs doing. You can change this later in your profile.
        </Text>

        {blockedBySystem ? (
          <View style={styles.warn}>
            <MaterialIcons name="notifications-off" size={18} color={Colors.onTertiaryContainer} />
            <Text style={styles.warnText}>
              Notifications are switched off for Agronavis in your phone’s settings. Your
              choices are saved, and alerts will still appear inside the app.
            </Text>
          </View>
        ) : null}

        <View style={styles.list}>
          {ALERT_CATEGORIES.map((id) => {
            const item = ALERTS[id];
            const on = enabled[id];
            return (
              <View key={id} style={styles.row}>
                <View style={[styles.iconBox, on && styles.iconBoxActive]}>
                  <MaterialIcons
                    name={item.icon}
                    size={22}
                    color={on ? Colors.primary : Colors.outline}
                  />
                </View>
                <View style={styles.rowText}>
                  <Text style={styles.rowTitle}>{item.title}</Text>
                  <Text style={styles.rowDesc}>{item.desc}</Text>
                </View>
                <Switch
                  value={on}
                  onValueChange={() => toggle(id)}
                  trackColor={{ false: Colors.surfaceContainerHigh, true: Colors.primaryFixed }}
                  thumbColor={on ? Colors.primary : Colors.outline}
                  accessibilityLabel={item.title}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity
          onPress={() => finish(true)}
          disabled={finishing}
          activeOpacity={0.88}
          accessibilityRole="button"
        >
          <View style={styles.finishBtn}>
            {finishing
              ? <Loader tone="onColor" size={28} />
              : <>
                  <Text style={styles.finishText}>Go to dashboard</Text>
                  <MaterialIcons name="check" size={20} color={Colors.onPrimary} />
                </>
            }
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => finish(false)}
          style={styles.skipBtn}
          disabled={finishing}
          accessibilityRole="button"
        >
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  brand: { ...TypeEmphasized.titleLarge, color: Colors.primary },
  w38: { width: 38 },

  progressWrap: { paddingHorizontal: Spacing.xl, marginBottom: Spacing.sm },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  stepLabel: { ...Type.labelLarge, color: Colors.onSurfaceVariant },
  stepSub: { ...Type.labelLarge, color: Colors.onSurfaceVariant },
  progressTrack: {
    height: 8, backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: Shape.extraSmall, overflow: 'hidden',
  },
  progressFull: { backgroundColor: Colors.primary, width: '100%', height: '100%' },

  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl },
  iconWrap: {
    width: 88, height: 88, borderRadius: Radii.xl,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginTop: Spacing.lg, marginBottom: Spacing.lg,
  },
  title: {
    ...TypeEmphasized.headlineSmall, color: Colors.onSurface,
    textAlign: 'center', marginBottom: Spacing.xs,
  },
  subtitle: {
    ...Type.bodyMedium, color: Colors.onSurfaceVariant,
    textAlign: 'center', marginBottom: Spacing.xl,
  },

  warn: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.tertiaryContainer, borderRadius: Shape.large,
    padding: Spacing.lg, marginBottom: Spacing.lg,
  },
  warnText: { ...Type.bodySmall, color: Colors.onTertiaryContainer, flex: 1 },

  list: { gap: Spacing.sm + 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xl, padding: Spacing.lg,
    borderWidth: 1, borderColor: Colors.outlineVariant,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: Radii.md,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBoxActive: { backgroundColor: Colors.primaryFixed },
  rowText: { flex: 1 },
  rowTitle: { ...TypeEmphasized.titleSmall, color: Colors.onSurface },
  rowDesc: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: 2 },

  footer: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  finishBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    minHeight: 56, borderRadius: Shape.full, gap: Spacing.sm,
  },
  finishText: { ...TypeEmphasized.titleMedium, color: Colors.onPrimary },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm, minHeight: 44, justifyContent: 'center' },
  skipText: { ...Type.labelLarge, color: Colors.onSurfaceVariant },
});
