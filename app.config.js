const path = require('path');
const fs = require('fs');

// One .env for the whole repo, beside this file. Values already present in the
// environment win, which is how EAS Build injects secrets.
const rootEnv = path.resolve(__dirname, '.env');
if (fs.existsSync(rootEnv)) {
  require('dotenv').config({ path: rootEnv, override: false });
}

const publicEnv = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1',
  apiTimeout: Number(process.env.EXPO_PUBLIC_API_TIMEOUT ?? 30000),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
  features: {
    sahayak: process.env.EXPO_PUBLIC_ENABLE_SAHAYAK !== 'false',
    marketPrices: process.env.EXPO_PUBLIC_ENABLE_MARKET_PRICES !== 'false',
    iot: process.env.EXPO_PUBLIC_ENABLE_IOT === 'true',
  },
};

const VERSION = '1.2.0';
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
  assetBundlePatterns: ['assets/images/*'],

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
    // The download token is only needed to fetch Mapbox's native SDK at build
    // time; it never reaches the app. Set MAPBOX_DOWNLOADS_TOKEN as an EAS
    // secret. The runtime token is the public pk.* one, read from extra below.
    [
      '@rnmapbox/maps',
      { RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN ?? '' },
    ],
    'expo-location',
    ['expo-camera', { cameraPermission: 'Allow Agronavis to access your camera for crop scanning.' }],
    ['expo-notifications', { icon: './assets/images/notification-icon.png', color: '#0E3D1F' }],
    [
      'expo-build-properties',
      {
        android: {
          // R8 strips unreachable classes from the app and its libraries;
          // resource shrinking then drops the drawables and strings that
          // nothing references. Together they take roughly 8 MB off the APK.
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          // Sahayak's model is loaded through LiteRT-LM by reflection; R8
          // cannot see those references and would strip the classes.
          extraProguardRules: [
            '-keep class com.google.ai.edge.litertlm.** { *; }',
            '-keep class expo.modules.gemma.** { *; }',
            '-dontwarn com.google.ai.edge.litertlm.**',
          ].join('\n'),
        },
      },
    ],
    './plugins/withAbiFilter',
    './plugins/withReleaseSigning',
  ],

  experiments: { typedRoutes: true },

  extra: {
    eas: { projectId: '4418b05e-cf5e-4ccc-a472-1bc936253a63' },
    router: {},
    ...publicEnv,
  },
});
