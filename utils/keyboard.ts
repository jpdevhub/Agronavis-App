import { Keyboard, Platform } from 'react-native';

/** Long enough for the slide-down, short enough never to feel like a stall. */
const HIDE_TIMEOUT_MS = 350;

/**
 * Puts the keyboard away and waits until it has actually gone.
 *
 * Submitting a form raised the loading screen while the keyboard was still up,
 * so the spinner appeared squeezed into the top half and the keyboard slid out
 * from under it a moment later. Awaiting the hide means whatever comes next is
 * drawn onto a whole screen.
 *
 * Resolves immediately when no keyboard is up, and falls back to a timer: the
 * hide event never fires if nothing was focused, and a missed event must not
 * strand a sign-in.
 */
export function dismissKeyboard(): Promise<void> {
  if (!Keyboard.isVisible()) {
    Keyboard.dismiss();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    // iOS reports the animation's start, Android only its end.
    const event = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      subscription.remove();
      resolve();
    };

    const subscription = Keyboard.addListener(event, finish);
    const timer = setTimeout(finish, HIDE_TIMEOUT_MS);
    Keyboard.dismiss();
  });
}
