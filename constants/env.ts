import Constants from 'expo-constants';

type Extra = {
  apiUrl: string;
  apiTimeout: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  mapboxToken: string;
  features: { sahayak: boolean; marketPrices: boolean; iot: boolean };
};

// app.config.js reads the repo-root .env and puts these here. process.env is
// the fallback for EAS builds, where the values arrive as real env vars.
const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

export const Env = {
  apiUrl: extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  apiTimeout: extra.apiTimeout ?? Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 30000),
  supabaseUrl: extra.supabaseUrl ?? process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: extra.supabaseAnonKey ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  mapboxToken: extra.mapboxToken ?? process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  features: {
    sahayak: extra.features?.sahayak ?? true,
    marketPrices: extra.features?.marketPrices ?? true,
    iot: extra.features?.iot ?? false,
  },
} as const;

