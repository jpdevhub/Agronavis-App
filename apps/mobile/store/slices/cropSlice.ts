import { createSlice } from '@reduxjs/toolkit';

const cropSlice = createSlice({
  name: 'crop',
  initialState: { crops: [], status: 'idle' as const },
  reducers: {
    setCrops: (state, action) => { state.crops = action.payload; },
  },
});

export const { setCrops } = cropSlice.actions;
export default cropSlice.reducer;
