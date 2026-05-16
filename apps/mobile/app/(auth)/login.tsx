import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Radii } from '@/constants/theme';

function SocialBtn({ icon, label }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string }) {
  return (
    <TouchableOpacity style={styles.socialBtn} activeOpacity={0.8}>
      <MaterialIcons name={icon} size={20} color={Colors.onSurface} />
      <Text style={styles.socialLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function LoginScreen() {
  const router = useRouter();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = () => {
    setLoading(true);
    // Simulate brief loading then navigate
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)/dashboard');
    }, 600);
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
            <View style={styles.inputWrap}>
              <MaterialIcons name="mail-outline" size={20} color={Colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                id="login-email"
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={Colors.outline}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Password</Text>
              <TouchableOpacity>
                <Text style={styles.forgotLink}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.inputWrap}>
              <MaterialIcons name="lock-outline" size={20} color={Colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                id="login-password"
                style={[styles.input, { paddingRight: 44 }]}
                placeholder="••••••••"
                placeholderTextColor={Colors.outline}
                secureTextEntry={!showPass}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(p => !p)}>
                <MaterialIcons
                  name={showPass ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={Colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit */}
          <TouchableOpacity onPress={handleLogin} disabled={loading} activeOpacity={0.88}>
            <LinearGradient
              colors={[Colors.primary, Colors.primaryContainer]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.submitBtn}
            >
              {loading
                ? <ActivityIndicator color={Colors.onPrimary} />
                : <Text style={styles.submitText}>Log In</Text>}
            </LinearGradient>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>Or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social stubs */}
          <View style={styles.socials}>
            <SocialBtn icon="g-translate" label="Google" />
            <SocialBtn icon="phone-iphone" label="Apple" />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
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
  scroll:       { flexGrow: 1, justifyContent: 'center', padding: 24 },
  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: Radii.xxl,
    padding: 28,
    gap: 20,
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
  },
  inputIcon:    { marginRight: 10 },
  input:        { flex: 1, fontSize: 15, fontWeight: '400', color: Colors.onSurface },
  eyeBtn:       { padding: 4 },
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
  divider:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: Colors.outlineVariant, opacity: 0.5 },
  dividerLabel: { fontSize: 13, color: Colors.onSurfaceVariant, fontWeight: '500' },
  socials:      { gap: 10 },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: Radii.lg,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  socialLabel:  { fontSize: 15, fontWeight: '600', color: Colors.onSurface },
  footer:       { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingTop: 4 },
  footerText:   { fontSize: 14, color: Colors.onSurfaceVariant },
  footerLink:   { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
