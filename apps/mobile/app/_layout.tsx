import { useEffect, useRef } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Colors, Spacing, Type } from '@/constants/theme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { authApi } from '@/services/endpoints';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/utils/supabase';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
  },
});

function AppShell() {
  const router = useRouter();
  const segments = useSegments();
  const url = Linking.useURL();

  const session = useAuthStore((s) => s.session);
  const isLoading = useAuthStore((s) => s.isLoading);
  const isOffline = useAuthStore((s) => s.isOffline);
  const initialize = useAuthStore((s) => s.initialize);
  const setSession = useAuthStore((s) => s.setSession);

  const routingFor = useRef<string | null>(null);

  usePushNotifications();

  useEffect(() => initialize(), [initialize]);

  // Supabase email confirmation arrives as a deep link with tokens in the hash.
  useEffect(() => {
    if (!url?.includes('#')) return;
    const params = new URLSearchParams(url.split('#')[1]);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken) return;

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ data, error }) => {
        if (!error && data.session) setSession(data.session);
      });
  }, [url, setSession]);

  useEffect(() => {
    if (isLoading) return;

    const group = segments[0];
    const inAuth = group === '(auth)';
    const inOnboarding = group === '(onboarding)';

    if (!session) {
      routingFor.current = null;
      if (!inAuth) router.replace('/(auth)/welcome');
      return;
    }

    if (inOnboarding || routingFor.current === session.user.id) return;
    routingFor.current = session.user.id;

    // One call decides where to land: it confirms the session against the API
    // and returns the profile and 2FA state together.
    (async () => {
      try {
        const { profile, twoFactor } = await authApi.me();
        if (twoFactor.enabled && inAuth) {
          router.replace('/(auth)/two-factor' as never);
        } else if (!profile.onboardingComplete) {
          router.replace('/(onboarding)/step1');
        } else if (inAuth) {
          router.replace('/(tabs)/dashboard');
        }
      } catch {
        // The API is unreachable. Let the user in rather than trapping them on
        // a spinner; screens degrade to their own error states.
        if (inAuth) router.replace('/(tabs)/dashboard');
      }
    })();
  }, [session, isLoading, segments, router]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.surface} />
      {isOffline ? (
        <View style={styles.offline}>
          <Text style={styles.offlineText}>No connection. Changes will sync when you are back.</Text>
        </View>
      ) : null}

      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="crops/index" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="profile/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/edit" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile/security" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <GestureHandlerRootView style={styles.root}>
          <AppShell />
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  offline: {
    backgroundColor: Colors.tertiaryContainer,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  offlineText: { ...Type.labelMedium, color: Colors.onTertiaryContainer },
});
