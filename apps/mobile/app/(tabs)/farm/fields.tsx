import { useCallback, useState } from 'react';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { Colors, Radii, Spacing, Type } from '@/constants/theme';
import { useDeleteField, useFarmFields } from '@/hooks/useFarmFields';
import { useFarmStore } from '@/store/useFarmStore';

export default function MappedFieldsScreen() {
  const router = useRouter();
  const { data: fields, isLoading, error, refetch } = useFarmFields();
  const deleteField = useDeleteField();
  const activeFieldId = useFarmStore((s) => s.activeFieldId);
  const setActiveField = useFarmStore((s) => s.setActiveField);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Delete field', `Remove "${name}" and its mapped boundary?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteField.mutate(id) },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
          <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
        </Pressable>
        <Text style={styles.headerTitle}>Mapped fields</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        {isLoading ? (
          [0, 1, 2].map((i) => (
            <View key={i} style={styles.skeleton}>
              <Skeleton height={92} radius={Radii.lg} />
            </View>
          ))
        ) : error ? (
          <EmptyState
            icon="cloud-off"
            title="Could not load your fields"
            description={error.message}
            actionLabel="Try again"
            onAction={() => refetch()}
          />
        ) : !fields?.length ? (
          <EmptyState
            icon="layers"
            title="No fields mapped yet"
            description="Draw a boundary on the satellite map and Agronavis will compute its area, soil profile and irrigation needs."
            actionLabel="Map a field"
            onAction={() => router.push('/(tabs)/farm/map' as never)}
          />
        ) : (
          fields.map((field) => {
            const active = field.id === activeFieldId;
            return (
              <Card key={field.id} variant={active ? 'filled' : 'outlined'} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTitleGroup}>
                    <Text style={styles.fieldName}>{field.name}</Text>
                    <Text style={styles.fieldMeta}>
                      {field.areaAcres.toFixed(2)} acres
                      {field.areaHectares !== null ? ` · ${field.areaHectares.toFixed(2)} ha` : ''}
                    </Text>
                  </View>
                  {active ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  ) : null}
                </View>

                {field.centerLatitude !== null && field.centerLongitude !== null ? (
                  <View style={styles.coords}>
                    <MaterialIcons name="place" size={16} color={Colors.onSurfaceVariant} />
                    <Text style={styles.coordsText}>
                      {field.centerLatitude.toFixed(5)}, {field.centerLongitude.toFixed(5)}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.actions}>
                  {active ? null : (
                    <Button
                      label="Set active"
                      variant="tonal"
                      onPress={() => setActiveField(field.id, field.farmId)}
                    />
                  )}
                  <Button
                    label="Delete"
                    variant="text"
                    onPress={() => confirmDelete(field.id, field.name)}
                  />
                </View>
              </Card>
            );
          })
        )}

        {fields?.length ? (
          <Button
            label="Map another field"
            icon="add-location-alt"
            fullWidth
            onPress={() => router.push('/(tabs)/farm/map' as never)}
          />
        ) : null}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  headerTitle: { ...Type.titleLarge, color: Colors.onSurface },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  headerSpacer: { width: 44 },
  scroll: { padding: Spacing.lg, gap: Spacing.md },
  skeleton: { marginBottom: Spacing.md },
  card: { gap: Spacing.md, padding: Spacing.lg },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardTitleGroup: { flex: 1, gap: 2 },
  fieldName: { ...Type.titleMedium, color: Colors.onSurface },
  fieldMeta: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  activeBadge: {
    backgroundColor: Colors.primaryContainer,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
  },
  activeBadgeText: { ...Type.labelSmall, color: Colors.onPrimaryContainer },
  coords: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  coordsText: { ...Type.bodySmall, color: Colors.onSurfaceVariant },
  actions: { flexDirection: 'row', gap: Spacing.sm },
  bottomSpace: { height: Spacing.xxxl },
});
