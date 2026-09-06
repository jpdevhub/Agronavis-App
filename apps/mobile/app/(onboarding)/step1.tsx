import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  StatusBar, ActivityIndicator, Image,
  KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Radii } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useOnboardingStore } from '@/store/useOnboardingStore';
import { farmerApi, storageApi } from '@/services/endpoints';

export default function OnboardingStep1() {
  const router = useRouter();
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
      Alert.alert('Permission needed', 'Allow photo access to set a profile picture.');
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

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.brand}>Agronavis</Text>
        <View style={styles.stepPill}>
          <Text style={styles.stepText}>Step 1 of 3</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progressTrack}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryContainer]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.progressFill33}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar picker */}
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

        {/* Full name */}
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

        {/* Phone */}
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

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleNext}
          disabled={!canContinue || saving}
          activeOpacity={0.88}
          style={!canContinue ? styles.nextDisabled : undefined}
        >
          <LinearGradient
            colors={canContinue ? [Colors.primary, Colors.primaryContainer] : ['#ccc', '#bbb']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.nextBtn}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Text style={styles.nextText}>Next: Map Your Farm</Text>
                  <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                </>
            }
          </LinearGradient>
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
    paddingHorizontal: 24, paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 12,
  },
  brand:         { fontSize: 22, fontWeight: '900', color: Colors.primary, letterSpacing: -0.5 },
  stepPill: {
    backgroundColor: Colors.primaryFixed, borderRadius: Radii.full,
    paddingHorizontal: 12, paddingVertical: 4,
  },
  stepText:      { fontSize: 12, fontWeight: '700', color: Colors.primary },
  progressTrack: { height: 6, backgroundColor: Colors.surfaceContainerHigh, marginHorizontal: 24 },
  progressFill33:{ width: '33%', height: '100%', borderRadius: 3 },

  scroll:        { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 24, gap: 16 },
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
  avatarHint:    { fontSize: 13, color: Colors.primary, fontWeight: '600', textAlign: 'center' },
  title:         { fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: Colors.onSurface, textAlign: 'center' },
  subtitle:      { fontSize: 14, color: Colors.onSurfaceVariant, lineHeight: 20, textAlign: 'center' },

  fieldGroup:    { gap: 6 },
  label:         { fontSize: 13, fontWeight: '600', color: Colors.onSurface },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 0,
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radii.lg, height: 52, paddingHorizontal: 14,
  },
  inputIcon:     { marginRight: 10 },
  input:         { flex: 1, fontSize: 15, color: Colors.onSurface },
  dialCode:      { fontSize: 15, fontWeight: '700', color: Colors.onSurface, marginRight: 10 },
  divider:       { width: 1, height: 24, backgroundColor: Colors.outlineVariant, marginRight: 10 },

  footer:        { padding: 24, paddingBottom: Platform.OS === 'ios' ? 40 : 24, gap: 8 },
  nextDisabled:  { opacity: 0.6 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    height: 56, borderRadius: Radii.xxl, gap: 8,
  },
  nextText:      { fontSize: 17, fontWeight: '700', color: '#fff' },
  hint:          { fontSize: 13, color: Colors.outline, textAlign: 'center' },
});
