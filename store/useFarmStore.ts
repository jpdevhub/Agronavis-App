import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

/**
 * Which field the app is currently talking about.
 *
 * `activeFieldId` drives the dashboard; `activeFarmId` is what the farm-scoped
 * endpoints need. Both survive a restart, because they did not — and every
 * cold start therefore began with nothing selected, which quietly disabled the
 * weather, soil and fire queries and left their cards blank on a farm that had
 * fields.
 *
 * Persisted by hand rather than with zustand's middleware: that module is
 * published as ESM using `import.meta`, which the web bundle cannot parse.
 * Reading and writing one key is less code than working around it, and it is
 * how the rest of this app already stores things.
 */
const KEY = 'agronavis.field-selection';

interface FarmStoreState {
  activeFieldId: string | null;
  activeFarmId: string | null;
  /** False until the stored selection has been read back from the device. */
  hydrated: boolean;
}

interface FarmStoreActions {
  setActiveField: (fieldId: string, farmId: string) => void;
  clearActiveField: () => void;
  hydrate: () => Promise<void>;
}

export const useFarmStore = create<FarmStoreState & FarmStoreActions>((set, get) => ({
  activeFieldId: null,
  activeFarmId: null,
  hydrated: false,

  setActiveField: (fieldId, farmId) => {
    set({ activeFieldId: fieldId, activeFarmId: farmId });
    void AsyncStorage.setItem(KEY, JSON.stringify({ fieldId, farmId })).catch(() => {
      // A selection that cannot be written just means the next start picks
      // the first field again, which is what it would have done anyway.
    });
  },

  clearActiveField: () => {
    set({ activeFieldId: null, activeFarmId: null });
    void AsyncStorage.removeItem(KEY).catch(() => {});
  },

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(KEY);
      const saved = raw ? (JSON.parse(raw) as { fieldId?: string; farmId?: string }) : null;
      // Both or neither: half a selection would leave a farm-scoped query
      // enabled with no farm to ask about.
      if (saved?.fieldId && saved?.farmId) {
        set({ activeFieldId: saved.fieldId, activeFarmId: saved.farmId });
      }
    } catch {
      // Unreadable or corrupt: start with nothing chosen.
    } finally {
      set({ hydrated: true });
    }
  },
}));
