import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { Colors, Shape, Spacing, Type } from '@/constants/theme';
import { Button } from '@/components/ui';
import { OtpInput } from '@/components/ui/OtpInput';
import { authApi } from '@/services/endpoints';

interface TwoFactorVerifyProps {
  onVerified: () => void;
  onCancel?: () => void;
}

export function TwoFactorVerify({ onVerified, onCancel }: TwoFactorVerifyProps) {
  const [useBackup, setUseBackup] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const verifyCode = useMutation({
    mutationFn: authApi.verifyTwoFactor,
    onSuccess: onVerified,
    onError: (err: Error) => setError(err.message),
  });

  const verifyBackup = useMutation({
    mutationFn: authApi.verifyBackupCode,
    onSuccess: onVerified,
    onError: (err: Error) => setError(err.message),
  });

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <MaterialIcons name="shield" size={28} color={Colors.onPrimaryContainer} />
      </View>

      <Text style={styles.title}>Verify it is you</Text>
      <Text style={styles.body}>
        {useBackup
          ? 'Enter one of the backup codes you saved when you turned on two-step sign in.'
          : 'Open your authenticator app and enter the code it is showing.'}
      </Text>

      {useBackup ? (
        <TextInput
          value={backupCode}
          onChangeText={(text) => {
            setError(null);
            setBackupCode(text.toUpperCase());
          }}
          placeholder="A1B2-C3D4"
          placeholderTextColor={Colors.outline}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={9}
          style={[styles.backupInput, error ? styles.inputError : null]}
          accessibilityLabel="Backup code"
        />
      ) : (
        <OtpInput
          onComplete={(code) => {
            setError(null);
            verifyCode.mutate(code);
          }}
          disabled={verifyCode.isPending}
          error={!!error}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {useBackup ? (
        <Button
          label="Verify backup code"
          fullWidth
          loading={verifyBackup.isPending}
          disabled={backupCode.replace(/-/g, '').length !== 8}
          onPress={() => verifyBackup.mutate(backupCode)}
        />
      ) : null}

      <Button
        label={useBackup ? 'Use authenticator app instead' : 'Use a backup code instead'}
        variant="text"
        onPress={() => {
          setError(null);
          setUseBackup((previous) => !previous);
        }}
      />

      {onCancel ? <Button label="Cancel" variant="text" onPress={onCancel} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.xl,
    gap: Spacing.lg,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
  },
  hero: {
    width: 64,
    height: 64,
    borderRadius: Shape.full,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  title: { ...Type.headlineSmall, color: Colors.onSurface, textAlign: 'center' },
  body: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center' },
  error: { ...Type.bodyMedium, color: Colors.error, textAlign: 'center' },
  backupInput: {
    height: 56,
    borderRadius: Shape.small,
    borderWidth: 1,
    borderColor: Colors.outline,
    backgroundColor: Colors.surfaceContainerLowest,
    paddingHorizontal: Spacing.lg,
    ...Type.titleMedium,
    color: Colors.onSurface,
    textAlign: 'center',
    letterSpacing: 3,
  },
  inputError: { borderColor: Colors.error, borderWidth: 2 },
});
