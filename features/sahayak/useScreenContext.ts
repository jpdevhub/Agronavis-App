import { usePathname } from 'expo-router';
import { screenInfoFor, type ScreenInfo } from './screenContext';

/** Where the farmer is right now, for the system prompt. */
export function useScreenContext(): { pathname: string; info: ScreenInfo | null } {
  const pathname = usePathname();
  return { pathname, info: screenInfoFor(pathname) };
}
