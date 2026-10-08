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

/**
 * Picks a state, not a mandi.
 *
 * Prices are pooled across whichever mandis in a state reported, because the
 * feeds carry only a fraction of them — so offering a particular mandi would
 * promise a figure the data cannot give.
 */
export function MandiFilterModal({ visible, initial, onClose, onApply }: Props) {
  const insets = useSafeAreaInsets();
  const [state, setState] = useState(initial.state);
  const [search, setSearch] = useState('');

  const { states } = useIndiaLocationLists(state);

  const visibleStates = useMemo(() => {
    const term = search.trim().toLowerCase();
    return term ? states.filter((s) => s.toLowerCase().includes(term)) : states;
  }, [states, search]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.scrim}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.xl }]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Choose a state</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <MaterialIcons name="close" size={22} color={Colors.onSurface} />
            </Pressable>
          </View>

          <Text style={styles.note}>
            Prices are pooled across the mandis in a state that reported.
          </Text>

          <View style={styles.searchWrap}>
            <MaterialIcons name="search" size={20} color={Colors.onSurfaceVariant} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search state"
              placeholderTextColor={Colors.onSurfaceVariant}
              style={styles.searchInput}
              autoCorrect={false}
            />
          </View>

          <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
            {visibleStates.map((option) => {
              const selected = option === state;
              return (
                <Pressable
                  key={option}
                  onPress={() => {
                    setSearch('');
                    setState(option);
                  }}
                  style={[styles.option, selected && styles.optionSelected]}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {option}
                  </Text>
                  {selected && <MaterialIcons name="check" size={20} color={Colors.primary} />}
                </Pressable>
              );
            })}
            {visibleStates.length === 0 && (
              <Text style={styles.empty}>Nothing matches that search.</Text>
            )}
          </ScrollView>

          <Pressable
            onPress={() => onApply({ state })}
            disabled={!state}
            style={[styles.apply, !state && styles.applyDisabled]}
            accessibilityRole="button"
          >
            <Text style={styles.applyText}>
              {state ? `Show ${state} prices` : 'Select a state'}
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
  note: { ...Type.bodySmall, color: Colors.onSurfaceVariant, marginTop: -Spacing.xs },

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
