import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  clerkToken: string | null;
  isOnboardingComplete: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  userId: null,
  clerkToken: null,
  isOnboardingComplete: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthenticated(state, action: PayloadAction<{ userId: string; token: string }>) {
      state.isAuthenticated = true;
      state.userId = action.payload.userId;
      state.clerkToken = action.payload.token;
    },
    setOnboardingComplete(state) {
      state.isOnboardingComplete = true;
    },
    logout(state) {
      state.isAuthenticated = false;
      state.userId = null;
      state.clerkToken = null;
    },
  },
});

export const { setAuthenticated, setOnboardingComplete, logout } = authSlice.actions;
export default authSlice.reducer;
