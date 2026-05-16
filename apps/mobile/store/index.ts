import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from 'redux';

import authReducer from './slices/authSlice';
import farmerReducer from './slices/farmerSlice';
import farmReducer from './slices/farmSlice';
import cropReducer from './slices/cropSlice';
import weatherReducer from './slices/weatherSlice';
import advisoryReducer from './slices/advisorySlice';
import uiReducer from './slices/uiSlice';

// ─── Root Reducer ─────────────────────────────────────────────────────────────
const rootReducer = combineReducers({
  auth: authReducer,
  farmer: farmerReducer,
  farm: farmReducer,
  crop: cropReducer,
  weather: weatherReducer,
  advisory: advisoryReducer,
  ui: uiReducer,
});

import { Platform } from 'react-native';

const safeStorage = {
  getItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve(null);
    return AsyncStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    if (Platform.OS === 'web' && typeof window === 'undefined') return Promise.resolve();
    return AsyncStorage.removeItem(key);
  },
};

// ─── Persist Config ───────────────────────────────────────────────────────────
const persistConfig = {
  key: 'agronavis-root',
  version: 1,
  storage: safeStorage,
  whitelist: ['auth', 'farmer', 'ui'], // Only persist auth, farmer profile, and UI prefs
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

// ─── Store ────────────────────────────────────────────────────────────────────
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// ─── Types ────────────────────────────────────────────────────────────────────
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
