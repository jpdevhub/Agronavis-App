import { useCallback } from 'react';
import { useRouter } from 'expo-router';

/**
 * Going back, with somewhere to go.
 *
 * `router.back()` throws GO_BACK was not handled by any navigator whenever
 * there is nothing behind the current screen — a notification opened straight
 * onto the alerts list, a deep link, a reload on the web, or any screen
 * reached by `replace`. The arrow then does nothing at all, which is how the
 * profile screen came to be a dead end.
 *
 * So: go back when there is a back to go to, and otherwise go somewhere
 * sensible. Every caller names its own fallback, because the right answer
 * differs — a legal page belongs behind Profile, a scan result behind the
 * camera.
 */
export function useGoBack(fallback = '/(tabs)/dashboard') {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace(fallback as never);
  }, [router, fallback]);
}
