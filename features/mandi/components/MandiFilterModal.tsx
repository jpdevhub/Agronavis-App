import { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors, Shape, Spacing, Type, TypeEmphasized } from '@/constants/theme';
import { useIndiaLocationLists } from '../useIndiaLocationLists';
import type { MandiFilter } from '../useMandiSearch';

interface Props {
  visible: boolean;
  initial: MandiFilter;
  onClose: () => void;
  onApply: (filter: MandiFilter) => void;
}

export function MandiFilterModal({ visible, initial, onClose, onApply }: Props) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState(initial.state);
  const [district, setDistrict] = useState(initial.district);
  const [search, setSearch] = useState('');

  const { states, districts } = useIndiaLocationLists(state);
  const picking: 'state' | 'district' = state ? 'district' : 'state';
  const options = picking === 'state' ? states : districts;

  const visibleOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? options.filter((o) => o.toLowerCase().includes(term)) : options;
  }, [options, search]);

  function choose(value: string) {
    setSearch('');
    if (picking === 'state') {
      setState(value);
      setDistrict('');
    } else {
      setDistrict(value);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Choose a mandi</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <MaterialIcons name="close" size={22} color={Colors.onSurface} />
            </Pressable>
          </View>

          <View style={styles.crumbs}>
            <Pressable
              onPress={() => {
                setState('');
                setDistrict('');
                setSearch('');
              }}
              style={[styles.crumb, picking === 'state' && styles.crumbActive]}
            >
              <Text style={[styles.crumbText, picking === 'state' && styles.crumbTextActive]}>
                {state || 'Select state'}
              </Text>
            </Pressable>
            <MaterialIcons name="chevron-right" size={18} color={Colors.onSurfaceVariant} />
            <View style={[styles.crumb, picking === 'district' && styles.crumbActive]}>
              <Text style={[styles.crumbText, picking === 'district' && styles.crumbTextActive]}>
                {district || 'All districts'}
              </Text>
            </View>
          </View>

          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={20} color={Colors.onSurfaceVariant} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={picking === 'state' ? 'Search state' : 'Search district'}
              placeholderTextColor={Colors.onSurfaceVariant}
              style={styles.searchInput}
              autoCorrect={false}
            />
          </View>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {visibleOptions.map((option) => {
              const selected = picking === 'state' ? option === state : option === district;
              return (
                <Pressable
                  key={option}
                  onPress={() => choose(option)}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                  {selected && <MaterialIcons name="check" size={20} color={Colors.primary} />}
                </Pressable>
              );
            })}
            {visibleOptions.length === 0 && (
              <Text style={styles.empty}>Nothing matches that search.</Text>
            )}
          </ScrollView>

          <Pressable
            onPress={() => onApply({ state, district })}
            disabled={!state}
            style={[styles.apply, !state && styles.applyDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.applyText}>
              {district ? `Show ${district} prices` : state ? `Show ${state} prices` : 'Select a state'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(11,28,48,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderTopLeftRadius: Shape.extraLarge,
    borderTopRightRadius: Shape.extraLarge,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    gap: Spacing.md,
    maxHeight: '86%',
  },
  handle: {
    width: 40, height: 4, borderRadius: Shape.full,
    backgroundColor: Colors.outlineVariant, alignSelf: 'center',
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...TypeEmphasized.titleLarge, color: Colors.onSurface },

  crumbs: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  crumb: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Shape.full, backgroundColor: Colors.surfaceContainerHigh,
  },
  crumbActive: { backgroundColor: Colors.secondaryContainer },
  crumbText: { ...Type.labelLarge, color: Colors.onSurfaceVariant },
  crumbTextActive: { color: Colors.onSecondaryContainer },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, height: 52,
    borderRadius: Shape.full, backgroundColor: Colors.surfaceContainerHigh,
  },
  searchInput: { flex: 1, ...Type.bodyLarge, color: Colors.onSurface },

  list: { flexGrow: 0 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Shape.large,
  },
  optionSelected: { backgroundColor: Colors.primaryFixed },
  optionText: { ...Type.bodyLarge, color: Colors.onSurface },
  optionTextSelected: { ...TypeEmphasized.bodyLarge, color: Colors.onPrimaryContainer },
  empty: { ...Type.bodyMedium, color: Colors.onSurfaceVariant, padding: Spacing.lg },

  apply: {
    height: 56, borderRadius: Shape.full, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  applyDisabled: { backgroundColor: Colors.outlineVariant },
  applyText: { ...TypeEmphasized.titleMedium, color: Colors.onPrimary },
});
