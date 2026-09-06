import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import type { DiseaseReference } from '@agronavis/shared-types';
import { Button, Card, EmptyState, Skeleton } from '@/components/ui';
import { Colors, Radii, Shape, Spacing, Type } from '@/constants/theme';
import { useDiseaseLibrary } from '@/hooks/useCropCatalog';
import { cropApi, storageApi } from '@/services/endpoints';
import { useFarmStore } from '@/store/useFarmStore';

type SaveState = { status: 'idle' | 'saving' | 'saved'; error?: string };

export default function ScanResultScreen() {
  const router = useRouter();
  const { imageUri } = useLocalSearchParams<{ imageUri?: string }>();
  const activeFarmId = useFarmStore((s) => s.activeFarmId);

  const { diseases, isLoading, error, refetch } = useDiseaseLibrary();
  const [search, setSearch] = useState('');
  const [cropType, setCropType] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [save, setSave] = useState<SaveState>({ status: 'idle' });

  const cropTypes = useMemo(
    () => Array.from(new Set(diseases.map((d) => d.cropType))).sort(),
    [diseases],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return diseases.filter((d) => {
      if (cropType && d.cropType !== cropType) return false;
      if (!term) return true;
      return d.name.toLowerCase().includes(term) || d.cropType.toLowerCase().includes(term);
    });
  }, [diseases, search, cropType]);

  async function recordAs(disease: DiseaseReference) {
    if (!imageUri) return;
    setSave({ status: 'saving' });
    try {
      const upload = await storageApi.upload(
        'crop-scans',
        imageUri,
        `scan-${Date.now()}.jpg`,
        'image/jpeg',
      );
      await cropApi.recordScan({
        farmId: activeFarmId ?? undefined,
        imageUrl: upload.publicUrl,
        detectedDisease: disease.name,
        recommendation: disease.treatment.join('\n'),
      });
      setSave({ status: 'saved' });
    } catch (err) {
      setSave({ status: 'idle', error: err instanceof Error ? err.message : 'Could not save the scan' });
    }
  }

  if (save.status === 'saved') {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
        <EmptyState
          icon="check-circle"
          title="Scan saved"
          description="The photo and the identification are on your farm record. Treatment steps are in your advisory feed."
          actionLabel="Back to scanning"
          onAction={() => router.replace('/(tabs)/scan' as never)}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photo} resizeMode="cover" />
          ) : (
            <View style={[styles.photo, styles.photoMissing]}>
              <MaterialIcons name="image-not-supported" size={40} color={Colors.onSurfaceVariant} />
            </View>
          )}
          <Pressable onPress={() => router.back()} style={styles.backBtn} accessibilityRole="button">
            <MaterialIcons name="arrow-back" size={22} color={Colors.onSurface} />
          </Pressable>
        </View>

        <View style={styles.body}>
          <Card variant="filled" style={styles.notice}>
            <View style={styles.noticeHead}>
              <MaterialIcons name="info" size={20} color={Colors.onTertiaryContainer} />
              <Text style={styles.noticeTitle}>Automatic detection is not live yet</Text>
            </View>
            <Text style={styles.noticeBody}>
              Agronavis does not guess a diagnosis it cannot make. Match the photo against the
              reference library below and the scan will be filed against your farm with the right
              treatment plan.
            </Text>
          </Card>

          {save.error ? <Text style={styles.error}>{save.error}</Text> : null}

          <Text style={styles.sectionTitle}>Reference library</Text>

          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={20} color={Colors.onSurfaceVariant} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search a disease or crop"
              placeholderTextColor={Colors.onSurfaceVariant}
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            <FilterChip label="All crops" active={cropType === null} onPress={() => setCropType(null)} />
            {cropTypes.map((c) => (
              <FilterChip
                key={c}
                label={c}
                active={cropType === c}
                onPress={() => setCropType(cropType === c ? null : c)}
              />
            ))}
          </ScrollView>

          {isLoading ? (
            [0, 1, 2].map((i) => (
              <View key={i} style={styles.skeleton}>
                <Skeleton height={68} radius={Radii.lg} />
              </View>
            ))
          ) : error ? (
            <EmptyState
              icon="cloud-off"
              title="Library unavailable"
              description={error.message}
              actionLabel="Try again"
              onAction={() => refetch()}
            />
          ) : visible.length === 0 ? (
            <EmptyState
              icon="search-off"
              title="No match"
              description="Nothing in the library matches that search. Try the crop name instead."
            />
          ) : (
            visible.map((disease) => (
              <DiseaseCard
                key={disease.id}
                disease={disease}
                open={openId === disease.id}
                busy={save.status === 'saving'}
                canSave={!!imageUri}
                onToggle={() => setOpenId(openId === disease.id ? null : disease.id)}
                onSelect={() => recordAs(disease)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function DiseaseCard({
  disease,
  open,
  busy,
  canSave,
  onToggle,
  onSelect,
}: {
  disease: DiseaseReference;
  open: boolean;
  busy: boolean;
  canSave: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  return (
    <Card variant={open ? 'filled' : 'outlined'} style={styles.diseaseCard}>
      <Pressable onPress={onToggle} style={styles.diseaseHead} accessibilityRole="button">
        <View style={styles.diseaseTitleGroup}>
          <Text style={styles.diseaseName}>{disease.name}</Text>
          <Text style={styles.diseaseMeta}>
            {disease.cropType}
            {disease.severity ? ` · ${disease.severity}` : ''}
          </Text>
        </View>
        <MaterialIcons
          name={open ? 'expand-less' : 'expand-more'}
          size={24}
          color={Colors.onSurfaceVariant}
        />
      </Pressable>

      {open ? (
        <View style={styles.diseaseBody}>
          {disease.description ? (
            <Text style={styles.diseaseText}>{disease.description}</Text>
          ) : null}

          {disease.symptoms.length ? (
            <View style={styles.list}>
              <Text style={styles.listTitle}>Symptoms</Text>
              {disease.symptoms.map((s) => (
                <Text key={s} style={styles.listItem}>
                  {s}
                </Text>
              ))}
            </View>
          ) : null}

          {disease.treatment.length ? (
            <View style={styles.list}>
              <Text style={styles.listTitle}>Treatment</Text>
              {disease.treatment.map((s) => (
                <Text key={s} style={styles.listItem}>
                  {s}
                </Text>
              ))}
            </View>
          ) : null}

          {busy ? (
            <ActivityIndicator color={Colors.primary} style={styles.busy} />
          ) : (
            <Button
              label={canSave ? 'This matches my photo' : 'No photo to file'}
              icon="check"
              fullWidth
              disabled={!canSave}
              onPress={onSelect}
            />
          )}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: Spacing.xxxl },

  hero: { height: 260, backgroundColor: Colors.surfaceContainerHigh },
  photo: { width: '100%', height: '100%' },
  photoMissing: { alignItems: 'center', justifyContent: 'center' },
  backBtn: {
    position: 'absolute',
    top: Spacing.xxl,
    left: Spacing.lg,
    width: 40,
    height: 40,
    borderRadius: Shape.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  body: { padding: Spacing.lg, gap: Spacing.md },

  notice: { padding: Spacing.lg, gap: Spacing.sm },
  noticeHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  noticeTitle: { ...Type.titleSmall, color: Colors.onSurface, flex: 1 },
  noticeBody: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },

  error: { ...Type.bodyMedium, color: Colors.error },
  sectionTitle: { ...Type.titleMedium, color: Colors.onSurface, marginTop: Spacing.sm },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    height: 52,
    borderRadius: Shape.full,
    backgroundColor: Colors.surfaceContainerHigh,
  },
  searchInput: { flex: 1, ...Type.bodyLarge, color: Colors.onSurface },

  filters: { gap: Spacing.sm, paddingVertical: Spacing.xs },
  chip: {
    paddingHorizontal: Spacing.lg,
    height: 32,
    justifyContent: 'center',
    borderRadius: Shape.small,
    borderWidth: 1,
    borderColor: Colors.outline,
  },
  chipActive: { backgroundColor: Colors.secondaryContainer, borderColor: 'transparent' },
  chipLabel: { ...Type.labelLarge, color: Colors.onSurfaceVariant },
  chipLabelActive: { color: Colors.onSecondaryContainer },

  skeleton: { marginBottom: Spacing.sm },
  diseaseCard: { paddingVertical: Spacing.xs },
  diseaseHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  diseaseTitleGroup: { flex: 1, gap: 2 },
  diseaseName: { ...Type.titleSmall, color: Colors.onSurface },
  diseaseMeta: { ...Type.bodySmall, color: Colors.onSurfaceVariant, textTransform: 'capitalize' },
  diseaseBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.outlineVariant,
    paddingTop: Spacing.md,
  },
  diseaseText: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  list: { gap: Spacing.xs },
  listTitle: { ...Type.labelLarge, color: Colors.onSurface },
  listItem: { ...Type.bodyMedium, color: Colors.onSurfaceVariant },
  busy: { paddingVertical: Spacing.md },
});
