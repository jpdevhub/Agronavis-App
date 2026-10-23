import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { farmerApi } from '@/services/endpoints';
import { useAuthStore } from '@/store/useAuthStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    // Banner is the heads-up; list is what keeps it in the shade afterwards.
    // An alert the farmer glances at and loses is worse than none, because
    // they believe they have been told something and cannot go back to it.
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Android 8 and later drop any notification naming a channel that does not
 * exist. This runs at import rather than inside the signed-in effect, because
 * the channel has to be there before anything can arrive — including the
 * Sahayak download, which belongs to no account at all.
 */
async function ensureChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Farm alerts',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#006C49',
    // Without this the notification is announced and then gone; it has to be
    // readable later from the shade.
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
  });
}
void ensureChannel();

/**
 * Registers the device with Expo and hands the token to the API, and decides
 * what happens when an alert arrives or is tapped.
 *
 * Expo's push service is what reaches both platforms — it hands off to FCM on
 * Android and APNs on iOS — so the server only ever talks to one endpoint.
 */
export function usePushNotifications() {
  const userId = useAuthStore((s) => s.user?.id);
  const router = useRouter();
  const client = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      const existing = await Notifications.getPermissionsAsync();
      const granted =
        existing.granted || (await Notifications.requestPermissionsAsync()).granted;
      if (!granted || cancelled) return;

      await ensureChannel();

      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        if (!cancelled && token) await farmerApi.registerPushToken(token);
      } catch (error) {
        // This was swallowed by a bare catch, and so nobody noticed that no
        // token had ever been registered for any farmer — which meant no push
        // had ever been delivered to anyone. A simulator or a build with no
        // FCM credentials both land here, and both are worth saying out loud.
        console.warn(
          '[push] no token — notifications will not reach this device:',
          (error as Error)?.message,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    // An alert arriving while the app is open is already in the list on the
    // server; refresh so the bell's count matches the banner the farmer just
    // saw rather than lagging a minute behind it.
    const received = Notifications.addNotificationReceivedListener(() => {
      void client.invalidateQueries({ queryKey: ['notifications'] });
    });

    // Tapping one has to land somewhere. Everything we send is readable in
    // full on the alerts screen, so that is where it goes.
    const tapped = Notifications.addNotificationResponseReceivedListener(() => {
      void client.invalidateQueries({ queryKey: ['notifications'] });
      router.push('/alerts' as never);
    });

    return () => {
      received.remove();
      tapped.remove();
    };
  }, [userId, router, client]);
}
