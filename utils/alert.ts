import { Alert, Platform } from 'react-native';

/**
 * react-native-web ships `Alert.alert` as an empty function, so on web every
 * dialog is silently swallowed — failures look like nothing happened at all.
 * These fall back to the browser's own dialogs.
 */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

/** Destructive confirmation. Runs `onConfirm` only on an explicit yes. */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  onConfirm: () => void,
): void {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}
