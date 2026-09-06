const path = require('path');
const fs = require('fs');

// One .env for the whole repo, at the root. Values already present in the
// environment win, which is how EAS Build injects secrets.
const rootEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv, override: false });
}

const publicEnv = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  apiTimeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 30000),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
  features: {
    sahayak: process.env.EXPO_PUBLIC_ENABLE_SAHAYAK !== 'false',
    marketPrices: process.env.EXPO_PUBLIC_ENABLE_MARKET_PRICES !== 'false',
    iot: process.env.EXPO_PUBLIC_ENABLE_IOT === 'true',
  },
};

const VERSION = '1.1.5';
const BUILD_NUMBER = 5;

/** @type {import('expo/config').ExpoConfig} */
module.exports = () => ({
  name: 'Agronavis',
  slug: 'agronavis',
  version: VERSION,
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'agronavis',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  assetBundlePatterns: ['**/*'],

  splash: {
    image: './assets/images/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0E3D1F',
  },

  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.agronavis.app',
    buildNumber: String(BUILD_NUMBER),
    infoPlist: {
      NSCameraUsageDescription:
        'Agronavis uses your camera to scan crops for disease detection.',
      NSLocationWhenInUseUsageDescription:
        'Agronavis uses your location to provide weather and soil data for your farm.',
      NSPhotoLibraryUsageDescription:
        'Agronavis needs access to your photos to upload farm images.',
    },
  },

  android: {
    package: 'com.agronavis.app',
    versionCode: BUILD_NUMBER,
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#0E3D1F',
    },
    googleMapsApiKey: publicEnv.googleMapsApiKey,
    permissions: [
      'android.permission.CAMERA',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.RECORD_AUDIO',
    ],
  },

  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },

  plugins: [
    'expo-router',
    'expo-font',
    'expo-location',
    ['expo-camera', { cameraPermission: 'Allow Agronavis to access your camera for crop scanning.' }],
    ['expo-notifications', { icon: './assets/images/notification-icon.png', color: '#0E3D1F' }],
    'expo-secure-store',
    '@react-native-community/datetimepicker',
    './plugins/withMonorepoFix',
  ],

  experiments: { typedRoutes: true },

  extra: {
    eas: { projectId: '4418b05e-cf5e-4ccc-a472-1bc936253a63' },
    router: {},
    ...publicEnv,
  },
});
