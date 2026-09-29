import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { Env } from '@/constants/env';

const supabaseUrl = Env.supabaseUrl;
const supabaseAnonKey = Env.supabaseAnonKey;

/**
 * Supabase is used for authentication only — every read and write goes through
 * the Agronavis API. Storage is chosen per platform because AsyncStorage's web
 * shim touches `window` at import time, which crashes `expo export --web`.
 */

// Determine storage adapter without touching window at module scope.
function getStorage() {
  // Running in Node.js (SSR during `expo export`) — skip storage entirely.
  if (typeof window === 'undefined') return undefined;
  // Web browser — localStorage is always available and synchronous.
  if (Platform.OS === 'web') return localStorage;
  // Native — use AsyncStorage (lazy-imported to avoid SSR issues).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@react-native-async-storage/async-storage').default;
}

const storage = getStorage();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    ...(storage ? { storage } : {}),
    autoRefreshToken: true,
    persistSession: storage !== undefined,
    detectSessionInUrl: false,
  },
});
