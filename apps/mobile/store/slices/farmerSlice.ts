import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Farmer } from '../../../../packages/shared-types/src/index';
import { RequestStatus } from '../../types/api.types';

interface FarmerState {
  profile: Farmer | null;
  status: RequestStatus;
  error: string | null;
}

const initialState: FarmerState = {
  profile: null,
  status: 'idle',
  error: null,
};

const farmerSlice = createSlice({
  name: 'farmer',
  initialState,
  reducers: {
    setFarmerProfile(state, action: PayloadAction<Farmer>) {
      state.profile = action.payload;
      state.status = 'succeeded';
      state.error = null;
    },
    setFarmerLoading(state) {
      state.status = 'loading';
    },
    setFarmerError(state, action: PayloadAction<string>) {
      state.status = 'failed';
      state.error = action.payload;
    },
    clearFarmerProfile(state) {
      state.profile = null;
      state.status = 'idle';
      state.error = null;
    },
  },
});

export const { setFarmerProfile, setFarmerLoading, setFarmerError, clearFarmerProfile } = farmerSlice.actions;
export default farmerSlice.reducer;
