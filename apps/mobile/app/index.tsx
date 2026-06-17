import { Redirect } from 'expo-router';

/**
 * Root index — Expo Router needs this file to handle the app's entry URL.
 * The root _layout.tsx handles session hydration and protected routing via
 * useAuthStore. This file always redirects to /(auth)/welcome; the layout
 * guard will immediately push to /(tabs)/dashboard if a session exists.
 */
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
