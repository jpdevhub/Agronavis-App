import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';

/**
 * What a farmer sees when a screen fails to render.
 *
 * Until this existed the answer was a blank white page: no message, no way
 * back, and nothing to report. A screen that broke in a released build was
 * indistinguishable from one that was slow, and there was no way to tell
 * which screen had even failed.
 *
 * It shows what went wrong, offers to try again, and keeps the detail
 * readable so it can be repeated to someone who can fix it.
 */
export function ScreenError({
  error,
  retry,
}: {
  error: Error;
  retry?: () => void;
}) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.badge}>
          <MaterialIcons name="error-outline" size={28} color={Colors.onErrorContainer} />
        </View>

        <Text style={styles.title}>This screen could not open</Text>
        <Text style={styles.message}>
          Something went wrong while drawing it. Your data is safe — nothing was lost.
        </Text>

        {retry ? (
          <Pressable onPress={retry} style={styles.button} accessibilityRole="button">
            <MaterialIcons name="refresh" size={18} color={Colors.onPrimary} />
            <Text style={styles.buttonText}>Try again</Text>
          </Pressable>
        ) : null}

        {/* Kept visible rather than hidden behind a debug flag: a farmer who
            can read this out is the fastest route to a fix. */}
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>What happened</Text>
          <Text style={styles.detailText} selectable>
            {error?.message || 'Unknown error'}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  body: { padding: Spacing.xl, gap: Spacing.md, flexGrow: 1, justifyContent: 'center' },
  badge: {
    width: 56, height: 56, borderRadius: Shape.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.errorContainer,
  },
  title: { ...TypeEmphasized.headlineSmall, color: Colors.onSurface },
  message: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, lineHeight: 20 },
  button: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    alignSelf: 'flex-start', marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,
    borderRadius: Shape.full, backgroundColor: Colors.primary,
  },
  buttonText: { ...TypeEmphasized.labelLarge, color: Colors.onPrimary },
  detail: {
    marginTop: Spacing.lg, padding: Spacing.lg, gap: Spacing.xs,
    borderRadius: Shape.large, backgroundColor: Colors.surfaceContainerLow,
  },
  detailLabel: { ...Type.labelSmall, color: Colors.onSurfaceVariant },
  detailText: { ...Type.bodySmall, color: Colors.onSurface, fontFamily: 'monospace' },
});
