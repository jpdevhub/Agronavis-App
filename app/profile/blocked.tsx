/**
 * The farmers this account has blocked.
 *
 * Blocking is only half a feature without this screen: the sheet that blocks
 * someone promises the decision can be undone, and this is where it is undone.
 */
import {
  View, Text, ScrollView, StyleSheet, StatusBar, TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useGoBack } from '@/hooks/useGoBack';
import { Colors, Radii, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { Avatar, Loader, ScreenError } from '@/components/ui';
import { showAlert } from '@/utils/alert';
import { useBlockedFarmers, useUnblockFarmer } from '@/hooks/useCommunitySafety';

export default function BlockedFarmersScreen() {
  const goBack = useGoBack('/profile');
  const insets = useSafeAreaInsets();
  const { data: blocked = [], isLoading, error, refetch } = useBlockedFarmers();
  const unblock = useUnblockFarmer();

  async function lift(id: string, name: string) {
    try {
      await unblock.mutateAsync(id);
    } catch {
      showAlert('Could not unblock', `${name} is still blocked. Try once more.`);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          onPress={() => goBack()}
          style={styles.iconBtn}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.title}>Blocked farmers</Text>
      </View>

      {error ? (
        <ScreenError error={error} retry={refetch} />
      ) : isLoading ? (
        <Loader size={28} style={{ marginTop: Spacing.xxl }} />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + Spacing.xl }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.intro}>
            You do not see their posts or comments in the community, and they do not see yours.
          </Text>

          {blocked.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="group" size={44} color={Colors.outlineVariant} />
              <Text style={styles.emptyTitle}>Nobody is blocked</Text>
              <Text style={styles.emptyBody}>
                If a post or a comment troubles you, open the menu on it to report it or block
                whoever wrote it.
              </Text>
            </View>
          ) : (
            blocked.map(farmer => {
              const name = farmer.fullName?.trim() || 'Farmer';
              const place = [farmer.district, farmer.state].filter(Boolean).join(', ');
              return (
                <View key={farmer.id} style={styles.row}>
                  <Avatar uri={farmer.avatarUrl} name={farmer.fullName} size={42} />
                  <View style={styles.rowText}>
                    <Text style={styles.rowName} numberOfLines={1}>{name}</Text>
                    {place ? <Text style={styles.rowPlace} numberOfLines={1}>{place}</Text> : null}
                  </View>
                  <TouchableOpacity
                    style={styles.unblockBtn}
                    onPress={() => lift(farmer.id, name)}
                    disabled={unblock.isPending}
                    activeOpacity={0.85}
                    accessibilityRole="button"
                    accessibilityLabel={`Unblock ${name}`}
                  >
                    {unblock.isPending && unblock.variables === farmer.id
                      ? <Loader size={20} />
                      : <Text style={styles.unblockText}>Unblock</Text>}
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: Radii.full,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.surfaceContainerHigh,
  },
  title: { ...TypeEmphasized.titleLarge, color: Colors.onSurface, flex: 1 },

  scroll: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  intro: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, marginBottom: Spacing.sm },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerLow,
    borderRadius: Shape.large,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    minHeight: 72,
  },
  rowText: { flex: 1 },
  rowName: { ...TypeEmphasized.titleSmall, color: Colors.onSurface },
  rowPlace: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: 1 },
  unblockBtn: {
    minHeight: 40, minWidth: 92, paddingHorizontal: Spacing.lg,
    borderRadius: Shape.full, borderWidth: 1, borderColor: Colors.outline,
    alignItems: 'center', justifyContent: 'center',
  },
  unblockText: { ...TypeEmphasized.labelLarge, color: Colors.onSurface },

  empty: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.xxl },
  emptyTitle: { ...TypeEmphasized.titleMedium, color: Colors.onSurface },
  emptyBody: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, textAlign: 'center' },
});
