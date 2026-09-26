import { useState } from 'react';
import { Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { LANGUAGES } from '@/constants';
import { setAppLanguage, isSupported } from '@/i18n';
import { useUpdateFarmer } from '@/hooks/useFarmer';

export default function OnboardingLanguage() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const updateFarmer = useUpdateFarmer();
  const [choice, setChoice] = useState('en');

  function confirm() {
    setAppLanguage(choice);
    // Stored on the profile so the choice follows the farmer to a new device.
    updateFarmer.mutate({ language: choice } as never);
    router.push('/(onboarding)/step1' as never);
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <ScrollView contentContainerStyle={[styles.scroll, { paddingTop: insets.top + Spacing.xxxl }]}>
        <View style={styles.icon}>
          <MaterialIcons name="translate" size={32} color={Colors.onPrimaryContainer} />
        </View>
        <Text style={styles.title}>{t('language.title')}</Text>
        <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

        <View style={styles.options}>
          {LANGUAGES.map((l) => {
            const selected = l.code === choice;
            const ready = isSupported(l.code);
            return (
              <Pressable
                key={l.code}
                onPress={() => setChoice(l.code)}
                style={[styles.option, selected && styles.optionSelected]}
              >
                <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                  {l.label}
                </Text>
                {/* Sahayak answers in every language; the interface is
                    translated for these two so far. */}
                {!ready && <Text style={styles.partial}>Sahayak only</Text>}
                {selected && <MaterialIcons name="check" size={20} color={Colors.onPrimary} />}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Pressable onPress={confirm} style={styles.confirm}>
          <Text style={styles.confirmText}>{t('language.confirm')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xl, alignItems: 'center' },
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
  options: { width: '100%', gap: Spacing.sm, marginTop: Spacing.xxl },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    height: 60, paddingHorizontal: Spacing.xl,
    borderRadius: Shape.full, borderWidth: 1, borderColor: Colors.outlineVariant,
    backgroundColor: Colors.surfaceContainerLowest,
  },
  optionSelected: { backgroundColor: Colors.primary, borderColor: 'transparent' },
  optionText: { ...Type.bodyLarge, color: Colors.onSurface, flex: 1 },
  optionTextSelected: { ...TypeEmphasized.bodyLarge, color: Colors.onPrimary },
  partial: { ...Type.labelSmall, color: Colors.onSurfaceVariant },
  footer: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.md },
  confirm: {
    height: 56, borderRadius: Shape.full, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmText: { ...TypeEmphasized.titleMedium, color: Colors.onPrimary },
});
