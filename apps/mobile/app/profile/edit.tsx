import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, StatusBar, ScrollView,
  Image, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Radii } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useFarmer, useUpdateFarmer } from '@/hooks/useFarmer';
import { storageApi } from '@/services/endpoints';

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone:     z.string().max(15).optional().or(z.literal('')),
  state:     z.string().max(60).optional().or(z.literal('')),
  district:  z.string().max(60).optional().or(z.literal('')),
});

type FormFields = z.infer<typeof schema>;

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAuthStore(state => state.user);

  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormFields>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', phone: '', state: '', district: '' },
  });

  const { data: farmer } = useFarmer();
  const updateFarmer = useUpdateFarmer();

  useEffect(() => {
    if (!farmer) return;
    reset({
      full_name: farmer.fullName ?? '',
      phone: farmer.phone ?? '',
      state: farmer.state ?? '',
      district: farmer.district ?? '',
    });
    if (farmer.avatarUrl) setAvatarUri(farmer.avatarUrl);
  }, [farmer, reset]);

  const pickAndUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled || !user) return;

    const asset = result.assets[0];
    const rawExtension = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const extension = rawExtension === 'jpg' ? 'jpeg' : rawExtension;

    setUploading(true);
    try {
      const upload = await storageApi.upload(
        'avatars',
        asset.uri,
        `avatar.${extension}`,
        `image/${extension}`,
      );
      // Cache-bust so the new picture shows immediately.
      const publicUrl = `${upload.publicUrl}?t=${Date.now()}`;
      await updateFarmer.mutateAsync({ avatarUrl: publicUrl });
      setAvatarUri(publicUrl);
    } catch (error) {
      Alert.alert('Upload failed', (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormFields) => {
    try {
      await updateFarmer.mutateAsync({
        fullName: data.full_name,
        phone: data.phone || null,
        state: data.state || null,
        district: data.district || null,
      });
      router.back();
    } catch (error) {
      Alert.alert('Save failed', (error as Error).message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.avatarWrap} onPress={pickAndUpload} activeOpacity={0.8}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <MaterialIcons name="person" size={44} color={Colors.onSurfaceVariant} />
            </View>
          )}
          <View style={styles.avatarOverlay}>
            {uploading
              ? <ActivityIndicator color={Colors.onPrimary} />
              : <MaterialIcons name="photo-camera" size={20} color={Colors.onPrimary} />}
          </View>
        </TouchableOpacity>

        <View style={styles.form}>
          <Field label="Full Name" error={errors.full_name?.message}>
            <Controller
              control={control}
              name="full_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Your name"
                  placeholderTextColor={Colors.outline}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </Field>

          <Field label="Phone" error={errors.phone?.message}>
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="+91 XXXXX XXXXX"
                  placeholderTextColor={Colors.outline}
                  keyboardType="phone-pad"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </Field>

          <Field label="State" error={errors.state?.message}>
            <Controller
              control={control}
              name="state"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Punjab"
                  placeholderTextColor={Colors.outline}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </Field>

          <Field label="District" error={errors.district?.message}>
            <Controller
              control={control}
              name="district"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Ludhiana"
                  placeholderTextColor={Colors.outline}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
          </Field>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          activeOpacity={0.88}
        >
          {isSubmitting
            ? <ActivityIndicator color={Colors.onPrimary} />
            : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error ? styles.inputError : null]}>
        {children}
      </View>
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    backgroundColor: 'rgba(248,249,255,0.95)',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06, shadowRadius: 12, elevation: 6,
  },
  iconBtn:     { padding: 8, borderRadius: Radii.full, backgroundColor: Colors.surfaceContainerHigh, width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.onSurface },
  scroll:      { paddingHorizontal: 20, paddingTop: 28, gap: 20, alignItems: 'center' },

  avatarWrap: {
    width: 110, height: 110, borderRadius: 55,
    overflow: 'hidden',
    shadowColor: '#0b1c30', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 6,
  },
  avatar:            { width: 110, height: 110 },
  avatarPlaceholder: { backgroundColor: Colors.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  avatarOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 36, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },

  form:        { width: '100%', gap: 14 },
  fieldGroup:  { gap: 6 },
  label:       { fontSize: 13, fontWeight: '600', color: Colors.onSurface },
  inputWrap: {
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radii.lg, height: 52,
    paddingHorizontal: 14, borderWidth: 1, borderColor: 'transparent',
    justifyContent: 'center',
  },
  inputError:  { borderColor: '#ef4444' },
  input:       { fontSize: 15, color: Colors.onSurface, fontWeight: '400' },
  fieldError:  { fontSize: 12, color: '#ef4444', fontWeight: '500' },

  saveBtn: {
    width: '100%', height: 54, borderRadius: Radii.xxl,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 5,
  },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: Colors.onPrimary },
});
