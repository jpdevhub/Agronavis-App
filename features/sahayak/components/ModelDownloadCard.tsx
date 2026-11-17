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
import { APPROX_SIZE_GB, canRunSahayak, type ModelVariant } from '../ondevice/modelFile';
import { Loader } from '@/components/ui';

interface Props {
  variant: ModelVariant;
  onReady: (path: string) => void;
}

const gb = (bytes: number) => `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;

/**
 * What went wrong, said to a farmer rather than to a socket.
 *
 * A dropped connection surfaced as "Software caused connection abort" — the
 * Java exception, verbatim, under a Download button. It also reads as final,
 * when the transfer picks up from where it stopped.
 */
function downloadFailureText(error: string): string {
  if (/connection abort|connection reset|socket|ECONNRESET|EPIPE|timed? ?out|network/i.test(error)) {
    return 'The connection dropped. What has downloaded is kept — tap again and it carries on.';
  }
  if (/space|ENOSPC/i.test(error)) {
    return 'There is not enough free space on the phone for the model.';
  }
  return error;
}

export function ModelDownloadCard({ variant, onReady }: Props) {
  const [warnMobile, setWarnMobile] = useState(false);

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
    if (!warnMobile && !(await isOnWifi())) {
      setWarnMobile(true);
      return;
    }
    // Returns as soon as the download is under way; the manager carries it
    // from here and tells everyone watching how it goes.
    void startDownload(variant);
  }, [variant, warnMobile]);

  const pct = progress?.fraction != null ? Math.round(progress.fraction * 100) : null;

  /**
   * Some phones cannot hold the model, and the honest thing is to say so
   * before the download rather than after 2.6 GB of mobile data. Android
   * evicts it almost as fast as it loads on a small device, so the assistant
   * would spend its life reloading and slow the phone down around it.
   */
  if (!canRunSahayak()) {
    return (
      <View style={styles.card}>
        <View style={styles.icon}>
          <MaterialIcons name="memory" size={30} color={Colors.onPrimaryContainer} />
        </View>
        <Text style={styles.title}>Sahayak needs a larger phone</Text>
        <Text style={styles.body}>
          The assistant runs entirely on the handset and needs about{' '}
          {APPROX_SIZE_GB[variant]} GB of memory free to answer. This phone does not have
          enough, so it would keep stopping.
        </Text>
        <Text style={styles.body}>
          Everything else in Agronavis works as it is — your soil, weather, fields and
          prices all come from the app itself.
        </Text>
      </View>
    );
  }

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
          <Pressable onPress={() => void pauseDownload()} style={styles.secondary}>
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
          {error ? <Text style={styles.error}>{downloadFailureText(error)}</Text> : null}
          <Pressable onPress={begin} style={styles.primary} accessibilityRole="button">
            {busy ? (
              <Loader tone="onColor" size={28} />
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
