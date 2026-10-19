import { useEffect, useRef, useState } from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as Linking from 'expo-linking';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
// Side-effect import: gives Mapbox its token before any screen can mount a
// map. Doing this inside a component meant whichever map screen was opened
// first decided whether the others crashed.
import '@/features/maps/init';
import { warmApi } from '@/services/warmup';
import { ScreenError } from '@/components/ui';
import { supabase } from '@/utils/supabase';

/** A week. Long enough that an app opened yesterday still has yesterday's data. */
const CACHE_LIFETIME_MS = 7 * 24 * 60 * 60_000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      /**
       * Never retry a refusal the server meant.
       *
       * The default retried everything twice, so one rate-limited request
       * became three and pushed the farmer further past the limit — which is
       * how browsing mandi prices produced "Too many requests". A 4xx is the
       * server's answer, not a failure to deliver one; only network trouble
       * and 5xx are worth asking again.
       */
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } })?.response?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5,
      /**
       * How long an answer survives after nothing is using it. The default is
       * five minutes, which meant an app reopened the next day started from
       * nothing and showed spinners while every screen refetched. Kept for a
       * week instead, so yesterday's reading is on screen immediately and the
       * network call behind it only corrects what changed.
       */
      gcTime: CACHE_LIFETIME_MS,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * The cache, written to the device.
 *
 * React Query holds everything in memory, so closing the app threw all of it
 * away — opening it the next morning meant ten to fifteen seconds of empty
 * screens while a sleeping free-tier API woke up and answered one request at a
 * time. Persisted, the app draws yesterday's figures at once and quietly
 * replaces them when the answers arrive.
 */
const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'agronavis.query-cache',
  // Writing on every change thrashes storage while a screen is loading.
  throttleTime: 2_000,
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

  /**
   * Wake the API while the farmer is still looking at yesterday's figures.
   *
   * The free tier sleeps after fifteen minutes idle and takes most of a
   * minute to come back. This was only called from the sign-in screens, so
   * anyone already signed in — which is everyone, after the first day — paid
   * that wait on their first real request instead. Pinging at launch means
   * the instance is usually up by the time anything needs it.
   */
  useEffect(() => {
    warmApi();
  }, []);

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
        <Stack.Screen name="crop-health/index" options={{ animation: 'slide_from_right' }} />
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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_LIFETIME_MS,
        // Bump when a cached shape changes, so an old payload cannot be
        // rehydrated into code that no longer understands it.
        buster: 'v1',
        dehydrateOptions: {
          // Only successful answers are worth keeping. A cached error would
          // be restored tomorrow as though it were still true.
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' && query.state.data !== undefined,
        },
      }}
    >
      <SafeAreaProvider>
        <ConnectivityProvider>
          <GestureHandlerRootView style={styles.root}>
            <NetworkBanner />
            <AppShell />
          </GestureHandlerRootView>
        </ConnectivityProvider>
      </SafeAreaProvider>
    </PersistQueryClientProvider>
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

/**
 * Expo Router renders this instead of a crashed screen.
 *
 * Without it a render error produced a blank page — the Sahayak screen came
 * back as nothing but its background colour, which is indistinguishable from
 * a screen that is merely slow. There was no message, no way back, and
 * nothing a farmer could report. Exported from the root layout so it covers
 * every route rather than the handful anyone thought to wrap.
 */
export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return <ScreenError error={error} retry={() => void retry()} />;
}
