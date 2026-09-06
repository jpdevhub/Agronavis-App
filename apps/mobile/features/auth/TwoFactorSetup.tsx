import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { MaterialIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import type { TwoFactorSetup as SetupPayload } from '@agronavis/shared-types';
import { Colors, Shape, Spacing, Type } from '@/constants/theme';
import { Button, Card, Surface } from '@/components/ui';
import { OtpInput } from '@/components/ui/OtpInput';
import { authApi } from '@/services/endpoints';

type Step = 'intro' | 'scan' | 'verify' | 'codes';

interface TwoFactorSetupProps {
  onDone: () => void;
}

export function TwoFactorSetup({ onDone }: TwoFactorSetupProps) {
  const [step, setStep] = useState<Step>('intro');
  const [setup, setSetup] = useState<SetupPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const begin = useMutation({
    mutationFn: authApi.setupTwoFactor,
    onSuccess: (payload) => {
      setSetup(payload);
      setStep('scan');
    },
    onError: (err: Error) => setError(err.message),
  });

  const verify = useMutation({
    mutationFn: authApi.verifyTwoFactor,
    onSuccess: () => {
      setError(null);
      setStep('codes');
    },
    onError: (err: Error) => setError(err.message),
  });

  if (step === 'intro') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.hero}>
          <MaterialIcons name="lock" size={28} color={Colors.onPrimaryContainer} />
        </View>
        <Text style={styles.title}>Add a second step to sign in</Text>
        <Text style={styles.body}>
          Your authenticator app will show a six-digit code that changes every thirty seconds. Even
          if someone learns your password, they cannot sign in without your phone.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Get started"
          fullWidth
          loading={begin.isPending}
          onPress={() => begin.mutate()}
        />
      </ScrollView>
    );
  }

  if (step === 'scan' && setup) {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Scan this code</Text>
        <Text style={styles.body}>
          Open Google Authenticator, Authy or any TOTP app and scan the square below.
        </Text>

        <Surface level={0} style={styles.qrSurface}>
          <Image source={{ uri: setup.qrCodeDataUrl }} style={styles.qr} resizeMode="contain" />
        </Surface>

        <Card variant="outlined" style={styles.manualCard}>
          <Text style={styles.manualLabel}>Cannot scan? Enter this key</Text>
          <Text selectable style={styles.manualKey}>
            {setup.manualKey}
          </Text>
          <Button
            label="Copy key"
            variant="text"
            icon="content-copy"
            onPress={() => Clipboard.setStringAsync(setup.manualKey)}
          />
        </Card>

        <Button label="I have scanned it" fullWidth onPress={() => setStep('verify')} />
      </ScrollView>
    );
  }

  if (step === 'verify') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Enter the six-digit code</Text>
        <Text style={styles.body}>Type the code your authenticator app is showing right now.</Text>

        <OtpInput
          onComplete={(code) => verify.mutate(code)}
          disabled={verify.isPending}
          error={!!error}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="Back" variant="text" onPress={() => setStep('scan')} />
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={[styles.hero, { backgroundColor: Colors.secondaryContainer }]}>
        <MaterialIcons name="check" size={28} color={Colors.onSecondaryContainer} />
      </View>
      <Text style={styles.title}>Two-step sign in is on</Text>
      <Text style={styles.body}>
        Save these backup codes somewhere safe. Each one works once, and they are the only way in if
        you lose your phone.
      </Text>

      <Card variant="filled" style={styles.codesCard}>
        {(setup?.backupCodes ?? []).map((code) => (
          <Text key={code} selectable style={styles.code}>
            {code}
          </Text>
        ))}
      </Card>

      <Button
        label="Copy all codes"
        variant="outlined"
        icon="content-copy"
        fullWidth
        onPress={() => Clipboard.setStringAsync((setup?.backupCodes ?? []).join('\n'))}
      />
      <Button label="Done" fullWidth onPress={onDone} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.xl, gap: Spacing.lg, backgroundColor: Colors.surface, flexGrow: 1 },
  hero: {
    width: 64,
    height: 64,
    borderRadius: Shape.full,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { ...Type.headlineSmall, color: Colors.onSurface },
  body: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  error: { ...Type.bodyMedium, color: Colors.error },
  qrSurface: { padding: Spacing.lg, alignSelf: 'center', backgroundColor: '#ffffff' },
  qr: { width: 220, height: 220 },
  manualCard: { padding: Spacing.lg, gap: Spacing.xs },
  manualLabel: { ...Type.labelMedium, color: Colors.onSurfaceVariant },
  manualKey: { ...Type.titleSmall, color: Colors.onSurface, letterSpacing: 1.5 },
  codesCard: { padding: Spacing.lg, gap: Spacing.sm },
  code: { ...Type.titleMedium, color: Colors.onSurface, letterSpacing: 2, textAlign: 'center' },
});
