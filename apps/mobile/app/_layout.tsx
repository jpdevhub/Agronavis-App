import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';

/**
 * Root layout — handles three responsibilities:
 *
 * 1. Auth hydration: calls initialize() to pull the persisted session and
 *    subscribe to every future auth state change.
 *
 * 2. Protected routing: redirects unauthenticated users to /(auth)/welcome
 *    and authenticated users away from the auth group.
 *
 * 3. Deep link handling: captures Supabase email confirmation URLs that contain
 *    #access_token or #error fragments and passes them to setSession before any
 *    route redirect fires. This prevents the race condition where the app routes
 *    before the session is committed.
 */
export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const url = Linking.useURL();

  const { session, isLoading, isOffline, initialize, setSession } = useAuthStore();

  // One-time initialization: hydrate from storage + subscribe to auth events
  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, []);

  // Handle deep links containing Supabase auth hash fragments
  useEffect(() => {
    if (!url) return;

    // Supabase email confirmation URLs embed the token as a hash fragment
    const fragment = url.includes('#') ? url.split('#')[1] : '';
    if (!fragment) return;

    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (!error && data.session) {
            setSession(data.session);
          }
        });
    }
  }, [url]);

  // Protected routing guard — runs whenever auth state or route changes
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)/dashboard');
    }
  }, [session, isLoading, segments]);

  // Offline banner — shows when the session persists but network is unreachable
  const offlineBanner = isOffline ? (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineText}>No connection — working offline</Text>
    </View>
  ) : null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      {offlineBanner}
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="crops/index" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="profile/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/edit" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  offlineBanner: {
    backgroundColor: '#92400e',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
