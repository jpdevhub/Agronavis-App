import { create } from 'zustand';

/**
 * Global farm/field selection state.
 * `activeFieldId` drives the dashboard — all widgets update when this changes.
 */

interface FarmStoreState {
  activeFieldId: string | null;
  activeFarmId: string | null;
}

interface FarmStoreActions {
  setActiveField: (fieldId: string, farmId: string) => void;
  clearActiveField: () => void;
}

export const useFarmStore = create<FarmStoreState & FarmStoreActions>((set) => ({
  activeFieldId: null,
  activeFarmId: null,

  setActiveField: (fieldId, farmId) =>
    set({ activeFieldId: fieldId, activeFarmId: farmId }),

  clearActiveField: () =>
    set({ activeFieldId: null, activeFarmId: null }),
}));
