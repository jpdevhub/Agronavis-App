import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { createModelDownload, isOnWifi, type DownloadProgress } from '../ondevice/download';
import { APPROX_SIZE_GB, type ModelVariant } from '../ondevice/modelFile';

interface Props {
  variant: ModelVariant;
  onReady: (path: string) => void;
}

const gb = (bytes: number) => `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;

export function ModelDownloadCard({ variant, onReady }: Props) {
  const [progress, setProgress] = useState<DownloadProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnMobile, setWarnMobile] = useState(false);
  const handle = useRef<Awaited<ReturnType<typeof createModelDownload>> | null>(null);

  const [resumed, setResumed] = useState(false);

  const begin = useCallback(async () => {
    setError(null);
    if (!warnMobile && !(await isOnWifi())) {
      setWarnMobile(true);
      return;
    }
    setBusy(true);
    handle.current = await createModelDownload(variant, setProgress);
    setResumed(handle.current.resuming);
    try {
      const path = await handle.current.start();
      onReady(path);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [variant, warnMobile, onReady]);

  const pct = progress?.fraction != null ? Math.round(progress.fraction * 100) : null;

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <MaterialIcons name="download-for-offline" size={30} color={Colors.onPrimaryContainer} />
      </View>

      <Text style={styles.title}>Download Sahayak</Text>
      <Text style={styles.body}>
        Sahayak answers on your phone, with no internet and nothing sent to a server. The model is
        about {APPROX_SIZE_GB[variant]} GB and downloads once.
      </Text>

      {busy ? (
        <View style={styles.progressWrap}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct ?? 0}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress
              ? `${gb(progress.receivedBytes)}${progress.totalBytes > 0 ? ` of ${gb(progress.totalBytes)}` : ''}${pct != null ? ` · ${pct}%` : ''}`
              : resumed
                ? 'Continuing where it stopped…'
                : 'Starting…'}
          </Text>
          <Pressable onPress={() => handle.current?.pause()} style={styles.secondary}>
            <Text style={styles.secondaryText}>Pause</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {warnMobile && (
            <View style={styles.notice}>
              <MaterialIcons name="signal-cellular-alt" size={18} color={Colors.onTertiaryContainer} />
              <Text style={styles.noticeText}>
                You are not on Wi-Fi. This will use several gigabytes of mobile data.
              </Text>
            </View>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable onPress={begin} style={styles.primary} accessibilityRole="button">
            {busy ? (
              <ActivityIndicator color={Colors.onPrimary} />
            ) : (
              <Text style={styles.primaryText}>
                {warnMobile ? 'Download anyway' : 'Download model'}
              </Text>
            )}
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: Spacing.xl, padding: Spacing.xl, gap: Spacing.md,
    borderRadius: Shape.extraLarge, backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
  },
  icon: {
    width: 64, height: 64, borderRadius: Shape.extraExtraLarge,
    backgroundColor: Colors.primaryFixed,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },
  body: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center' },

  progressWrap: { width: '100%', gap: Spacing.sm, alignItems: 'center' },
  track: {
    width: '100%', height: 8, borderRadius: Shape.full,
    backgroundColor: Colors.surfaceContainerHighest, overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: Shape.full, backgroundColor: Colors.primary },
  progressText: { ...Type.labelMedium, color: Colors.onSurfaceVariant },

  notice: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md, borderRadius: Shape.large,
    backgroundColor: Colors.tertiaryFixed,
  },
  noticeText: { ...Type.bodySmall, color: Colors.onTertiaryContainer, flex: 1 },
  error: { ...Type.bodyMedium, color: Colors.error, textAlign: 'center' },

  primary: {
    height: 56, width: '100%', borderRadius: Shape.full,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  primaryText: { ...TypeEmphasized.titleMedium, color: Colors.onPrimary },
  secondary: { height: 44, paddingHorizontal: Spacing.xl, justifyContent: 'center' },
  secondaryText: { ...TypeEmphasized.labelLarge, color: Colors.primary },
});
