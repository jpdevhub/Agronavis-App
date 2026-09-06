import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
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

/** Registers the device with Expo and hands the token to the API. */
export function usePushNotifications() {
  const userId = useAuthStore((s) => s.user?.id);

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
}
