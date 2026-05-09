import { createSlice } from '@reduxjs/toolkit';

const advisorySlice = createSlice({
  name: 'advisory',
  initialState: { advisories: [], status: 'idle' as const },
  reducers: {
    setAdvisories: (state, action) => { state.advisories = action.payload; },
  },
});

export const { setAdvisories } = advisorySlice.actions;
export default advisorySlice.reducer;
