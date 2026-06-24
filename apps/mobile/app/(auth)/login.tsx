import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, StatusBar,
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

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFields = z.infer<typeof loginSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginFields) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });

    if (error) {
      // Show inline — Alert.alert is unreliable on web
      setAuthError(error.message);
      return;
    }

    // Navigate directly — don't rely solely on onAuthStateChange chain
    // (the root layout guard acts as a fallback for session-restore on boot)
    try {
      const { data: farmer } = await supabase
        .from('farmers')
        .select('onboarding_complete')
        .eq('id', (await supabase.auth.getUser()).data.user!.id)
        .single();

      if (farmer?.onboarding_complete) {
        router.replace('/(tabs)/dashboard' as any);
      } else {
        router.replace('/(onboarding)/step1' as any);
      }
    } catch {
      // If the DB query fails just go to dashboard
      router.replace('/(tabs)/dashboard' as any);
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
            <Text style={styles.subtitle}>The Precision Horizon</Text>
          </View>

          {/* Email */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputWrap, errors.email && styles.inputError]}>
              <MaterialIcons name="mail-outline" size={20} color={Colors.onSurfaceVariant} style={styles.inputIcon} />
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    id="login-email"
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
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity id="login-forgot-password">
                <Text style={styles.forgotLink}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.inputWrap, errors.password && styles.inputError]}>
              <MaterialIcons name="lock-outline" size={20} color={Colors.onSurfaceVariant} style={styles.inputIcon} />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    id="login-password"
                    style={[styles.input, { paddingRight: 44 }]}
                    placeholder="Min 8 characters"
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

          {/* Auth-level error banner */}
          {authError && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={16} color="#991b1b" />
              <Text style={styles.errorBannerText}>{authError}</Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity
            id="login-submit"
            onPress={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            activeOpacity={0.88}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.submitBtn}
            >
              {isSubmitting
                ? <ActivityIndicator color={Colors.onPrimary} />
                : <Text style={styles.submitText}>Log In</Text>}
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <TouchableOpacity id="login-go-register" onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: Colors.surface },
  scroll:       { flexGrow: 1, justifyContent: 'center', padding: 24, alignItems: 'center' },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xxl,
    padding: 28,
    gap: 20,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#0b1c30',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 32,
    elevation: 4,
  },
  header:       { alignItems: 'center', gap: 4 },
  brand:        { fontSize: 28, fontWeight: '900', letterSpacing: -0.8, color: Colors.primary },
  subtitle:     { fontSize: 14, fontWeight: '500', color: Colors.onSurfaceVariant },
  fieldGroup:   { gap: 6 },
  label:        { fontSize: 13, fontWeight: '600', color: Colors.onSurface },
  labelRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotLink:   { fontSize: 13, fontWeight: '600', color: Colors.primary },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceContainerHighest,
    borderRadius: Radii.lg,
    height: 56,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputError:   { borderColor: '#ef4444' },
  inputIcon:    { marginRight: 10 },
  input:        { flex: 1, fontSize: 15, fontWeight: '400', color: Colors.onSurface },
  eyeBtn:       { padding: 4 },
  fieldError:   { fontSize: 12, color: '#ef4444', fontWeight: '500' },
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
  submitText:   { fontSize: 17, fontWeight: '700', color: Colors.onPrimary, letterSpacing: 0.2 },
  footer:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 4 },
  footerText:   { fontSize: 14, color: Colors.onSurfaceVariant },
  footerLink:   { fontSize: 14, fontWeight: '700', color: Colors.primary },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#991b1b',
    lineHeight: 18,
  },
});
