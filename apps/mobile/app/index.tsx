import { Redirect } from 'expo-router';

/**
 * Root index — Expo Router needs this file to handle the app's entry URL.
 * Redirects immediately to the auth welcome screen.
 * Once authentication is integrated (Clerk), add your auth check here:
 *   - isSignedIn → redirect to /(tabs)
 *   - not signed in → redirect to /(auth)/welcome
 */
export default function Index() {
  return <Redirect href="/(auth)/welcome" />;
}
