import { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/utils/supabase';
import { Colors } from '@/constants/theme';

/**
 * Singleton QueryClient — created once, never recreated on re-render.
 * Default config: 2 retries on failure, 5-min staleTime for all queries.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

/**
 * Root layout — three responsibilities:
 * 1. Auth hydration + session sync via Zustand
 * 2. Onboarding gate: checks `farmers.onboarding_complete` once after login;
 *    new users are redirected to /(onboarding)/step1, returning users go straight
 *    to /(tabs)/dashboard. The check is skipped if already in the onboarding group.
 * 3. Deep-link handler: captures Supabase email-confirmation hash fragments.
 */
export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const url = Linking.useURL();

  const { session, isLoading, isOffline, initialize, setSession } = useAuthStore();
  const onboardingChecked = useRef(false);

  // One-time initialization: hydrate from storage + subscribe to auth events
  useEffect(() => {
    const unsubscribe = initialize();
    return unsubscribe;
  }, []);

  // Reset the onboarding check whenever the user changes (sign out / sign in)
  useEffect(() => {
    onboardingChecked.current = false;
  }, [session?.user?.id]);

  // Handle deep links containing Supabase auth hash fragments
  useEffect(() => {
    if (!url) return;
    const fragment = url.includes('#') ? url.split('#')[1] : '';
    if (!fragment) return;

    const params = new URLSearchParams(fragment);
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ data, error }) => {
          if (!error && data.session) setSession(data.session);
        });
    }
  }, [url]);

  // Protected routing + onboarding gate
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup       = segments[0] === '(auth)';
    const inOnboardingGroup = segments[0] === '(onboarding)';

    // Not logged in → send to auth
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
      return;
    }

    // Logged in → check onboarding ONCE regardless of which route we're on.
    // This covers both:
    //   a) Fresh login: user is still in (auth) group
    //   b) Persisted session: app boots directly into (tabs)
    if (session && !inOnboardingGroup && !onboardingChecked.current) {
      onboardingChecked.current = true;

      (async () => {
        try {
          const { data } = await supabase
            .from('farmers')
            .select('onboarding_complete')
            .eq('id', session.user.id)
            .single();

          if (data?.onboarding_complete) {
            // Only redirect if stuck in auth; otherwise stay on current tab
            if (inAuthGroup) router.replace('/(tabs)/dashboard');
          } else {
            router.replace('/(onboarding)/step1');
          }
        } catch {
          // DB error (e.g. column not yet migrated) → don't block the user
          if (inAuthGroup) router.replace('/(tabs)/dashboard');
        }
      })();
    }
  }, [session, isLoading, segments]);


  const offlineBanner = isOffline ? (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineText}>No connection — working offline</Text>
    </View>
  ) : null;

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
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
