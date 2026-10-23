import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, Image,
  KeyboardAvoidingView, Platform, ScrollView, } from 'react-native';
import { dismissKeyboard } from '@/utils/keyboard';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Radii, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { showAlert } from '@/utils/alert';
import { useAuthStore } from '@/store/useAuthStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { farmerApi, storageApi } from '@/services/endpoints';
import { Loader } from '@/components/ui';

export default function OnboardingStep1() {
  const router = useRouter();
  // Android draws edge to edge, so the status bar sits over the header and the
  // gesture bar over the footer unless both are told how much room to leave.
  const insets = useSafeAreaInsets();
  const user   = useAuthStore((s) => s.user);
  const { setProfile } = useOnboardingStore();

  // Pre-fill name from auth metadata if available
  const metaName = (user as any)?.user_metadata?.full_name ?? '';
  const [fullName, setFullName]   = useState(metaName);
  const [phone, setPhone]         = useState('');
  const [avatarUri, setAvatarUri] = useState('');
  const [saving, setSaving]       = useState(false);

  const canContinue = fullName.trim().length >= 2;

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission needed', 'Allow photo access to set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleNext() {
    if (!canContinue || !user) return;
    await dismissKeyboard();
    setSaving(true);

    try {
      let avatarUrl: string | undefined;

      if (avatarUri) {
        const extension = avatarUri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const mime = extension === 'png' ? 'image/png' : 'image/jpeg';
        const upload = await storageApi.upload('avatars', avatarUri, `avatar.${extension}`, mime);
        avatarUrl = upload.publicUrl;
      }

      await farmerApi.update({
        fullName: fullName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
      });

      setProfile(fullName.trim(), phone.trim(), avatarUri);
    } catch {
      // Non-fatal — continue regardless
    }

    setSaving(false);
    router.push('/(onboarding)/step2' as any);
  }

  const displayAvatar = avatarUri || null;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={styles.brand}>Agronavis</Text>
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>Step 1 of 3</Text>
        </View>
      </View>

      <View style={styles.progressTrack}>
        <View style={styles.progressFill33} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} activeOpacity={0.85}>
          {displayAvatar
            ? <Image source={{ uri: displayAvatar }} style={styles.avatarImg} />
            : (
              <View style={styles.avatarPlaceholder}>
                <MaterialIcons name="person" size={52} color={Colors.primary} />
              </View>
            )
          }
          <View style={styles.avatarEdit}>
            <MaterialIcons name="camera-alt" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Upload Profile Photo</Text>

        <Text style={styles.title}>Your Profile</Text>
        <Text style={styles.subtitle}>
          This personalises your Agronavis experience and helps us verify your account.
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Full Name *</Text>
          <View style={styles.inputWrap}>
            <MaterialIcons name="person-outline" size={20} color={Colors.outline} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. Rajesh Kumar"
              placeholderTextColor={Colors.outline}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Mobile Number (optional)</Text>
          <View style={styles.inputWrap}>
            <Text style={styles.dialCode}>+91</Text>
            <View style={styles.divider} />
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              placeholderTextColor={Colors.outline}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              returnKeyType="done"
            />
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canContinue || saving}
          activeOpacity={0.88}
          style={!canContinue ? styles.nextDisabled : undefined}
        >
          <View style={[styles.nextBtn, !canContinue && styles.nextBtnIdle]}>
            {saving
              ? <Loader tone="onColor" size={28} />
              : <>
                  <Text style={styles.nextText}>Next: Map Your Farm</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </>
            }
          </View>
        </TouchableOpacity>
        {!canContinue && (
          <Text style={styles.hint}>Enter your full name to continue</Text>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md,
  },
  brand:         { ...TypeEmphasized.titleLarge, color: Colors.primary },
  stepPill: {
    backgroundColor: Colors.primaryFixed, borderRadius: Radii.full,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
  },
  stepText:      { ...TypeEmphasized.labelMedium, color: Colors.primary },
  progressTrack: {
    height: 6, backgroundColor: Colors.surfaceContainerHigh,
    marginHorizontal: Spacing.xl, borderRadius: Shape.extraSmall,
  },
  progressFill33:{ backgroundColor: Colors.primary, width: '33%', height: '100%', borderRadius: 3 },

  scroll: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl, gap: Spacing.lg,
  },
  avatarWrap:    { alignSelf: 'center', marginBottom: 4, position: 'relative' },
  avatarImg:     { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: Colors.primaryFixed },
  avatarPlaceholder: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  avatarEdit: {
    position: 'absolute', bottom: 4, right: 4,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarHint:    { ...Type.labelLarge, color: Colors.primary, textAlign: 'center' },
  title:         { ...TypeEmphasized.headlineSmall, color: Colors.onSurface, textAlign: 'center' },
  subtitle:      { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center' },

  fieldGroup:    { gap: Spacing.xs + 2 },
  label:         { ...Type.labelLarge, color: Colors.onSurface },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radii.lg, minHeight: 52, paddingHorizontal: Spacing.lg,
  },
  inputIcon:     { marginRight: Spacing.sm + 2 },
  input:         { ...Type.bodyLarge, flex: 1, color: Colors.onSurface, paddingVertical: Spacing.sm },
  dialCode:      { ...TypeEmphasized.bodyLarge, color: Colors.onSurface, marginRight: Spacing.sm + 2 },
  divider:       { width: 1, height: 24, backgroundColor: Colors.outlineVariant, marginRight: Spacing.sm + 2 },

  footer: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, gap: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.outlineVariant,
    backgroundColor: Colors.surface,
  },
  nextDisabled:  { opacity: 0.6 },
  nextBtn: { backgroundColor: Colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    minHeight: 56, borderRadius: Shape.full, gap: Spacing.sm,
  },
  nextBtnIdle: { backgroundColor: Colors.outlineVariant },
  nextText:      { ...TypeEmphasized.titleMedium, color: Colors.onPrimary },
  hint:          { ...Type.bodySmall, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
