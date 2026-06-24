import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client — platform-aware storage to avoid SSR crash.
 *
 * Problem: Expo Router's static renderer runs in Node.js (no `window`).
 * AsyncStorage's web shim calls `window.localStorage` at module-init time,
 * causing "ReferenceError: window is not defined" during `expo export --web`.
 *
 * Solution:
 *  - Web browser → use the native `localStorage` directly (always available).
 *  - Native (iOS / Android) → use AsyncStorage as before.
 *  - SSR / Node.js → no storage, no session persistence (safe, it's a server).
 *
 * `detectSessionInUrl: false` — Expo Router handles deep-link routing at the
 * framework layer, so the Supabase client must NOT attempt to parse URLs.
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
