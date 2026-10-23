import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { LANGUAGES } from '@/constants';
import { setAppLanguage, isInterfaceReady } from '@/i18n';
import { useUpdateFarmer } from '@/hooks/useFarmer';

export default function OnboardingLanguage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const updateFarmer = useUpdateFarmer();
  const [choice, setChoice] = useState('en');

  function confirm() {
    setAppLanguage(choice);
    // Stored on the profile so the choice follows the farmer to a new device,
    // and so Sahayak knows which language to answer in.
    updateFarmer.mutate({ language: choice } as never);
    router.push('/(onboarding)/step1' as never);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.xxl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.icon}>
          <MaterialIcons name="translate" size={32} color={Colors.onPrimaryContainer} />
        </View>
        <Text style={styles.title}>{t('language.title')}</Text>
        <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

        <View style={styles.options}>
          {LANGUAGES.map((l) => {
            const selected = l.code === choice;
            return (
              <Pressable
                key={l.code}
                onPress={() => setChoice(l.code)}
                style={[styles.option, selected && styles.optionSelected]}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={l.label}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {l.label}
                </Text>
                {selected ? (
                  <MaterialIcons name="check" size={20} color={Colors.onPrimary} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Said once, plainly, instead of hung as a tag on six of the eight
            rows. A farmer who picks their language and watches every screen
            stay in English decides the app is broken — so tell them before
            they choose, not after. */}
        {!isInterfaceReady(choice) ? (
          <View style={styles.note}>
            <MaterialIcons name="info-outline" size={18} color={Colors.onSecondaryContainer} />
            <Text style={styles.noteText}>
              Sahayak will talk with you in {LANGUAGES.find((l) => l.code === choice)?.label}.
              The rest of the screens are still in English — we are translating them.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable onPress={confirm} style={styles.confirm} accessibilityRole="button">
          <Text style={styles.confirmText}>{t('language.confirm')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  icon: {
    width: 72, height: 72, borderRadius: Shape.extraExtraLarge,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.lg,
  },
  title: { ...TypeEmphasized.headlineSmall, color: Colors.onSurface, textAlign: 'center' },
  subtitle: {
    ...Type.bodyMedium, color: Colors.onSurfaceVariant,
    textAlign: 'center', marginTop: Spacing.sm, maxWidth: 320,
  },
  options: { width: '100%', gap: Spacing.sm, marginTop: Spacing.xl },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    minHeight: 60, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.xl,
    borderRadius: Shape.full, borderWidth: 1, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  optionSelected: { backgroundColor: Colors.primary, borderColor: 'transparent' },
  optionText: { ...Type.bodyLarge, color: Colors.onSurface, flex: 1 },
  optionTextSelected: { ...TypeEmphasized.bodyLarge, color: Colors.onPrimary },

  note: {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    backgroundColor: Colors.secondaryContainer,
    borderRadius: Shape.large,
    padding: Spacing.lg, marginTop: Spacing.lg,
  },
  noteText: { ...Type.bodySmall, color: Colors.onSecondaryContainer, flex: 1 },

  footer: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  confirm: {
    minHeight: 56, borderRadius: Shape.full, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmText: { ...TypeEmphasized.titleMedium, color: Colors.onPrimary },
});
