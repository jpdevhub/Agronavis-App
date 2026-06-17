import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Supabase client configured for React Native.
 *
 * - storage: AsyncStorage ensures the session survives app restarts.
 * - autoRefreshToken: silently re-fetches the access token before it expires.
 * - persistSession: keeps the session across cold starts.
 * - detectSessionInUrl: false — Expo Router handles deep-link routing at the
 *   framework layer, so the Supabase client must NOT attempt to parse URLs.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
