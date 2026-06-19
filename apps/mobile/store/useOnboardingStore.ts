import { create } from 'zustand';

interface OnboardingState {
  fullName: string;
  phoneNumber: string;
  avatarUri: string;   // local file URI (before upload)
  state: string;
  district: string;
}

interface OnboardingActions {
  setProfile: (fullName: string, phoneNumber: string, avatarUri?: string) => void;
  setLocation: (state: string, district: string) => void;
  reset: () => void;
}

const INITIAL: OnboardingState = {
  fullName: '',
  phoneNumber: '',
  avatarUri: '',
  state: '',
  district: '',
};

export const useOnboardingStore = create<OnboardingState & OnboardingActions>((set) => ({
  ...INITIAL,
  setProfile: (fullName, phoneNumber, avatarUri = '') =>
    set({ fullName, phoneNumber, avatarUri }),
  setLocation: (state, district) => set({ state, district }),
  reset: () => set(INITIAL),
}));
