import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '@types/ui.types';

interface UIState {
  theme: ThemeMode;
  language: string;
  isLoading: boolean;
}

const uiSlice = createSlice({
  name: 'ui',
  initialState: { theme: 'dark' as ThemeMode, language: 'en', isLoading: false } satisfies UIState,
  reducers: {
    setTheme: (state, action: PayloadAction<ThemeMode>) => { state.theme = action.payload; },
    setLanguage: (state, action: PayloadAction<string>) => { state.language = action.payload; },
    setLoading: (state, action: PayloadAction<boolean>) => { state.isLoading = action.payload; },
  },
});

export const { setTheme, setLanguage, setLoading } = uiSlice.actions;
export default uiSlice.reducer;
