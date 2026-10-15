import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, Spacing, TypeEmphasized } from '@/constants/theme';
import { Loader } from './Loader';

/**
 * Covers the gap between signing in and landing somewhere.
 *
 * That gap is a real network call — the session is confirmed against the API,
 * which also answers where to send the farmer — and on a cold server it runs
 * to several seconds. Before this, the login button went idle the moment the
 * password was accepted and the screen then sat there saying nothing, which
 * reads as a failure and gets tapped again.
 */
export interface LoadingScreenProps {
  /** What is being waited on. Keep it short and plain. */
  message?: string;
  /** A second line, shown straight away. */
  detail?: string;
  /**
   * Replaces `detail` once the wait has run long enough to need explaining.
   * Our API sleeps when idle and takes half a minute to come back, and a
   * farmer watching a silent screen for that long assumes it has broken.
   */
  slowDetail?: string;
}

/** Past this, the wait stops being normal and gets explained. */
const SLOW_MS = 6_000;

export function LoadingScreen({ message = 'Just a moment…', detail, slowDetail }: LoadingScreenProps) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!slowDetail) return;
    const timer = setTimeout(() => setSlow(true), SLOW_MS);
    return () => clearTimeout(timer);
  }, [slowDetail]);

  const line = slow && slowDetail ? slowDetail : detail;

  return (
    <View style={styles.root}>
      <View style={styles.block}>
        <Loader size={64} />
        <View style={styles.text}>
          <Text style={styles.message}>{message}</Text>
          {line ? <Text style={styles.detail}>{line}</Text> : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  block: { alignItems: 'center', gap: Spacing.xl },
  text: { alignItems: 'center', gap: Spacing.xs },
  message: { ...TypeEmphasized.titleMedium, color: Colors.onSurface, textAlign: 'center' },
  detail: { fontSize: 14, lineHeight: 20, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
