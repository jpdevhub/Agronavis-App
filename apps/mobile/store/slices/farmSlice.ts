import { createSlice } from '@reduxjs/toolkit';

const farmSlice = createSlice({
  name: 'farm',
  initialState: { farms: [], selectedFarmId: null as string | null, status: 'idle' as const },
  reducers: {
    setFarms: (state, action) => { state.farms = action.payload; },
    setSelectedFarm: (state, action) => { state.selectedFarmId = action.payload; },
  },
});

export const { setFarms, setSelectedFarm } = farmSlice.actions;
export default farmSlice.reducer;
