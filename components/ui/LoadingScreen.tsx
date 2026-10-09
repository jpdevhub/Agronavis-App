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
  /** A second line for when the wait runs long. */
  detail?: string;
}

export function LoadingScreen({ message = 'Just a moment…', detail }: LoadingScreenProps) {
  return (
    <View style={styles.root}>
      <View style={styles.block}>
        <Loader size={64} />
        <View style={styles.text}>
          <Text style={styles.message}>{message}</Text>
          {detail ? <Text style={styles.detail}>{detail}</Text> : null}
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
