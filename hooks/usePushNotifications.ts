import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { farmerApi } from '@/services/endpoints';
import { useAuthStore } from '@/store/useAuthStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Farm alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#006C49',
        });
      }

      try {
        const { data: token } = await Notifications.getExpoPushTokenAsync();
        if (!cancelled && token) await farmerApi.registerPushToken(token);
      } catch {
        // A missing projectId or a simulator: push is optional, carry on.
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
