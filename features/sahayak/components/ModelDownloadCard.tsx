import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { isOnWifi } from '../ondevice/download';
import {
  acknowledgeDownload,
  getDownloadState,
  pauseDownload,
  startDownload,
  subscribeToDownload,
} from '../ondevice/downloadManager';
import { SIZE_LABEL, type ModelVariant } from '../ondevice/modelFile';
import { Loader } from '@/components/ui';

interface Props {
  variant: ModelVariant;
  onReady: (path: string) => void;
}

const gb = (bytes: number) => `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;

const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)} MB`;
const size = (bytes: number) => (bytes >= 1024 * 1024 * 1024 ? gb(bytes) : mb(bytes));

export function ModelDownloadCard({ variant, onReady }: Props) {
  /**
   * Wi-Fi only. Online answers already cost a farmer nothing to start, so the
   * offline model is an extra, and an extra must not eat a day's mobile data
   * on a prepaid plan.
   */
  const [needsWifi, setNeedsWifi] = useState(false);

  /**
   * The download runs outside this component and outlives it.
   *
   * It used to live here, so walking to another screen unmounted the card
   * and abandoned several gigabytes of progress. The card now watches a
   * download it does not own, which means leaving mid-way costs nothing and
   * coming back shows it where it got to.
   */
  const [state, setState] = useState(getDownloadState);
  useEffect(() => subscribeToDownload(setState), []);

  const progress = state.progress;
  const busy = state.running;
  const error = state.error;
  const resumed = state.resuming;

  // A download that finished while the farmer was elsewhere still has to be
  // handed over when they come back to this card.
  useEffect(() => {
    if (!state.finishedPath) return;
    const path = state.finishedPath;
    acknowledgeDownload();
    onReady(path);
  }, [state.finishedPath, onReady]);

  const begin = useCallback(async () => {
    if (!(await isOnWifi())) {
      setNeedsWifi(true);
      return;
    }
    setNeedsWifi(false);
    // Returns as soon as the download is under way; the manager carries it
    // from here and tells everyone watching how it goes.
    void startDownload(variant);
  }, [variant]);

  const pct = progress?.fraction != null ? Math.round(progress.fraction * 100) : null;

  return (
    <View style={styles.card}>
      <View style={styles.icon}>
        <MaterialIcons name="download-for-offline" size={30} color={Colors.onPrimaryContainer} />
      </View>

      <Text style={styles.title}>Offline Sahayak</Text>
      <Text style={styles.body}>
        With this on your phone, Sahayak can answer with no internet, and nothing is sent to a
        server. It is {SIZE_LABEL[variant]} and downloads once, over Wi-Fi.
      </Text>

      {busy ? (
        <View style={styles.progressWrap}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${pct ?? 0}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progress
              ? `${size(progress.receivedBytes)}${progress.totalBytes > 0 ? ` of ${size(progress.totalBytes)}` : ''}${pct != null ? ` · ${pct}%` : ''}`
              : resumed
                ? 'Continuing where it stopped…'
                : 'Starting…'}
          </Text>
          <Pressable onPress={() => void pauseDownload()} style={styles.secondary}>
            <Text style={styles.secondaryText}>Pause</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {needsWifi && (
            <View style={styles.notice}>
              <MaterialIcons name="wifi-off" size={18} color={Colors.onTertiaryContainer} />
              <Text style={styles.noticeText}>
                Connect to Wi-Fi to download. Until then, Sahayak still answers whenever you have
                internet.
              </Text>
            </View>
          )}
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable onPress={begin} style={styles.primary} accessibilityRole="button">
            {busy ? (
              <Loader tone="onColor" size={28} />
            ) : (
              <Text style={styles.primaryText}>
                {needsWifi ? 'Try again on Wi-Fi' : 'Download'}
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
