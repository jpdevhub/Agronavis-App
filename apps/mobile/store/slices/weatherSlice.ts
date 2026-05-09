import { createSlice } from '@reduxjs/toolkit';

const weatherSlice = createSlice({
  name: 'weather',
  initialState: { current: null as any, forecast: [], status: 'idle' as const },
  reducers: {
    setWeather: (state, action) => { state.current = action.payload.current; state.forecast = action.payload.forecast; },
  },
});

export const { setWeather } = weatherSlice.actions;
export default weatherSlice.reducer;
