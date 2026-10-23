import * as Notifications from 'expo-notifications';

/**
 * Takes this account's alerts out of the phone's notification shade.
 *
 * Signing out or deleting an account removes the rows on the server, but
 * anything already posted stays in the shade until it is tapped — so a farmer
 * who deleted their account could still read "frost expected on your field
 * tonight" from a phone that no longer has an account, and tapping it opened
 * an app with nothing behind it.
 *
 * Never throws. Clearing the tray is housekeeping, and it must not be able to
 * fail a sign-out.
 */
export async function clearNotificationTray(): Promise<void> {
  try {
    await Notifications.dismissAllNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // Web has no tray, and a denied permission makes this a no-op.
  }
}
