import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Which field the app is currently talking about.
 *
 * `activeFieldId` drives the dashboard; `activeFarmId` is what the farm-scoped
 * endpoints need. Both are persisted, because they were not and every cold
 * start therefore began with nothing selected — which quietly disabled the
 * weather, soil and fire queries and left their cards rendering nothing at
 * all, on a farm that had fields.
 */
interface FarmStoreState {
  activeFieldId: string | null;
  activeFarmId: string | null;
  /** False until the persisted selection has been read back from the device. */
  hydrated: boolean;
}

interface FarmStoreActions {
  setActiveField: (fieldId: string, farmId: string) => void;
  clearActiveField: () => void;
  setHydrated: () => void;
}

export const useFarmStore = create<FarmStoreState & FarmStoreActions>()(
  persist(
    (set) => ({
      activeFieldId: null,
      activeFarmId: null,
      hydrated: false,

      setActiveField: (fieldId, farmId) =>
        set({ activeFieldId: fieldId, activeFarmId: farmId }),

      clearActiveField: () => set({ activeFieldId: null, activeFarmId: null }),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: 'agronavis.field-selection',
      storage: createJSONStorage(() => AsyncStorage),
      // `hydrated` describes this run, not the farmer's choice.
      partialize: (s) => ({ activeFieldId: s.activeFieldId, activeFarmId: s.activeFarmId }),
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
