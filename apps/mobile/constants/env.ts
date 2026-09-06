import Constants from 'expo-constants';

type Extra = {
  apiUrl: string;
  apiTimeout: number;
  supabaseUrl: string;
  supabaseAnonKey: string;
  googleMapsApiKey: string;
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
  googleMapsApiKey:
    extra.googleMapsApiKey ?? process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  features: {
    sahayak: extra.features?.sahayak ?? true,
    marketPrices: extra.features?.marketPrices ?? true,
    iot: extra.features?.iot ?? false,
  },
} as const;

/** Socket.IO connects to the server root, not the versioned REST prefix. */
export const socketUrl = Env.apiUrl.replace(/\/api\/v\d+\/?$/, '');
