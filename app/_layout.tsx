import { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { setAppLanguage } from '@/i18n';
import { useFarmer } from '@/hooks/useFarmer';
import { Colors, Spacing, Type } from '@/constants/theme';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { LoadingScreen } from '@/components/ui';
import { readLanding, writeLanding, type Landing } from '@/features/auth/landingCache';
import { ConnectivityProvider, NetworkBanner } from '@/shared/network';
import { useSyncOnReconnect } from '@/shared/offline';
import { authApi } from '@/services/endpoints';
import { useAuthStore } from '@/store/useAuthStore';
import { useFarmStore } from '@/store/useFarmStore';
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

  /**
   * True while the session is being confirmed against the API, which is also
   * the call that decides where to send the farmer. It is a real network round
   * trip and on a cold server runs to several seconds; without this the login
   * button went idle the moment the password was accepted and the screen sat
   * blank until the answer arrived.
   */
  const [resolving, setResolving] = useState(false);

  // Read the remembered field back once, before anything asks for it.
  const hydrateFarm = useFarmStore((s) => s.hydrate);
  useEffect(() => {
    void hydrateFarm();
  }, [hydrateFarm]);

  usePushNotifications();
  useSyncOnReconnect();

  // The farmer's stored language beats the device locale.
  const { data: profile } = useFarmer();
  useEffect(() => setAppLanguage(profile?.language), [profile?.language]);

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

    const userId = session.user.id;

    const land = (landing: Landing): void => {
      if (landing.twoFactorEnabled && inAuth) {
        router.replace('/(auth)/two-factor' as never);
      } else if (!landing.onboardingComplete) {
        router.replace('/(onboarding)/language' as never);
      } else if (inAuth) {
        router.replace('/(tabs)/dashboard');
      }
    };

    (async () => {
      // Where a returning farmer lands was decided last time and almost never
      // changes, so it is answered from the device and the screen moves at
      // once. Only a first sign-in on this device has nothing to go on, and
      // only that one waits.
      const remembered = await readLanding(userId);
      if (remembered) {
        land(remembered);
      } else if (inAuth) {
        setResolving(true);
      }

      try {
        // Still asked either way. When it was answered from the cache this
        // runs behind whatever is now on screen and corrects the rare case
        // where onboarding was finished, or two-factor turned on, elsewhere.
        const { profile, twoFactor } = await authApi.me();
        const fresh: Landing = {
          onboardingComplete: profile.onboardingComplete,
          twoFactorEnabled: twoFactor.enabled,
        };
        await writeLanding(userId, fresh);

        const changed =
          !remembered ||
          remembered.onboardingComplete !== fresh.onboardingComplete ||
          remembered.twoFactorEnabled !== fresh.twoFactorEnabled;
        if (changed) land(fresh);
      } catch {
        // Unreachable, or still booting. Someone with nothing remembered is
        // let through rather than held on a loader; the screens they land on
        // have their own empty and error states.
        if (!remembered && inAuth) router.replace('/(tabs)/dashboard');
      } finally {
        setResolving(false);
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
        <Stack.Screen name="alerts/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="fires/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="root-zone/index" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="legal/terms" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="legal/privacy" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="legal/security" options={{ animation: 'slide_from_bottom' }} />
      </Stack>

      {/*
        Drawn OVER the navigator, never instead of it. Returning early here
        unmounts the Stack, and the router.replace that decides where to land
        then fires into a navigator that no longer exists — so the redirect is
        lost and the remount lands back on the login screen. Which is the bug
        this screen was added to fix.
      */}
      {isLoading || resolving ? (
        <View style={styles.overlay}>
          <LoadingScreen
            message={resolving ? 'Getting your farm ready' : 'Warming up'}
            detail={resolving ? 'Two seconds. Promise.' : undefined}
            slowDetail={
              resolving
                ? 'Okay, slightly more than two seconds — our server naps when nobody is around and is stretching now. First sign-in of the day only, then it is instant.'
                : undefined
            }
          />
        </View>
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ConnectivityProvider>
          <GestureHandlerRootView style={styles.root}>
            <NetworkBanner />
            <AppShell />
          </GestureHandlerRootView>
        </ConnectivityProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surface },
  /** Covers the navigator without unmounting it. */
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
  },
  offline: {
    backgroundColor: Colors.tertiaryContainer,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  offlineText: { ...Type.labelMedium, color: Colors.onTertiaryContainer },
});
