import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, StatusBar, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';
import { supabase } from '@/utils/supabase';

// ─── Validation Schema ────────────────────────────────────────────────────────

const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(80, 'Name is too long'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[0-9!@#$%^&*]/, 'Password must include a number or special character'),
  agreed: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms to continue' }),
  }),
});

type RegisterFields = z.infer<typeof registerSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: '', email: '', password: '', agreed: undefined },
  });

  const agreedValue = watch('agreed');

  const onSubmit = async (data: RegisterFields) => {
    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { full_name: data.fullName } },
    });

    if (error) {
      Alert.alert('Registration failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brand}>Agronavis</Text>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join the precision horizon.</Text>
          </View>

          {/* Full Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputWrap, errors.fullName && styles.inputError]}>
              <MaterialIcons name="person-outline" size={20} color={Colors.onSurfaceVariant} style={styles.icon} />
              <Controller
                control={control}
                name="fullName"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    id="register-name"
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={Colors.outline}
                    autoCapitalize="words"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
            {errors.fullName && <Text style={styles.fieldError}>{errors.fullName.message}</Text>}
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrap, errors.email && styles.inputError]}>
              <MaterialIcons name="mail-outline" size={20} color={Colors.onSurfaceVariant} style={styles.icon} />
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    id="register-email"
                    style={styles.input}
                    placeholder="your@email.com"
                    placeholderTextColor={Colors.outline}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
            </View>
            {errors.email && <Text style={styles.fieldError}>{errors.email.message}</Text>}
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrap, errors.password && styles.inputError]}>
              <MaterialIcons name="lock-outline" size={20} color={Colors.onSurfaceVariant} style={styles.icon} />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    id="register-password"
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="Min 8 chars, 1 number or symbol"
                    placeholderTextColor={Colors.outline}
                    secureTextEntry={!showPass}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                  />
                )}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
                <MaterialIcons
                  name={showPass ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={Colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.fieldError}>{errors.password.message}</Text>}
          </View>

          {/* Terms */}
          <View style={styles.terms}>
            <Controller
              control={control}
              name="agreed"
              render={({ field: { onChange, value } }) => (
                <TouchableOpacity
                  id="register-terms-checkbox"
                  style={[styles.checkbox, value && styles.checkboxChecked]}
                  onPress={() => onChange(value ? undefined : true)}
                  activeOpacity={0.8}
                >
                  {value && <MaterialIcons name="check" size={14} color={Colors.onPrimary} />}
                </TouchableOpacity>
              )}
            />
            <Text style={styles.termsText}>
              I agree to the{' '}
              <Text style={styles.termsLink}>Terms and Conditions</Text>
            </Text>
          </View>
          {errors.agreed && <Text style={[styles.fieldError, { marginTop: -8 }]}>{errors.agreed.message}</Text>}

          {/* Submit */}
          <TouchableOpacity
            id="register-submit"
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={agreedValue ? [Colors.primary, Colors.primaryContainer] : [Colors.outlineVariant, Colors.outlineVariant]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtn}
            >
              {isSubmitting
                ? <ActivityIndicator color={Colors.onPrimary} />
                : <Text style={styles.submitText}>Create Account</Text>}
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity id="register-go-login" onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.footerLink}>Log in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1, backgroundColor: Colors.surface },
  scroll:         { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Radii.xl,
    padding: 28,
    gap: 18,
    shadowColor: '#0b1c30',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
  },
  header:         { alignItems: 'center', gap: 4 },
  brand:          { fontSize: 26, fontWeight: '900', letterSpacing: -0.8, color: Colors.primary },
  title:          { fontSize: 26, fontWeight: '700', letterSpacing: -0.5, color: Colors.onSurface, marginTop: 4 },
  subtitle:       { fontSize: 14, fontWeight: '400', color: Colors.onSurfaceVariant },
  fieldGroup:     { gap: 6 },
  label:          { fontSize: 13, fontWeight: '600', color: Colors.onSurfaceVariant },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radii.lg,
    height: 52,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError:     { borderColor: '#ef4444' },
  icon:           { marginRight: 10 },
  input:          { flex: 1, fontSize: 15, fontWeight: '400', color: Colors.onSurface },
  eyeBtn:         { padding: 4 },
  fieldError:     { fontSize: 12, color: '#ef4444', fontWeight: '500' },
  terms:          { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.outlineVariant, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
  },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  termsText:      { flex: 1, fontSize: 13, color: Colors.onSurfaceVariant, lineHeight: 20 },
  termsLink:      { fontWeight: '600', color: Colors.primary },
  submitBtn: {
    height: 56,
    borderRadius: Radii.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 5,
  },
  submitText:     { fontSize: 17, fontWeight: '700', color: Colors.onPrimary, letterSpacing: 0.2 },
  footer:         { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 4 },
  footerText:     { fontSize: 14, color: Colors.onSurfaceVariant },
  footerLink:     { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
