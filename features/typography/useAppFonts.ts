import { useFonts } from 'expo-font';
import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_600SemiBold,
  Roboto_700Bold,
  Roboto_800ExtraBold,
} from '@expo-google-fonts/roboto';

/**
 * The five cuts the type scale names.
 *
 * Loaded, not bundled by the config plugin, so a cut that fails to load
 * leaves the app readable in the system font rather than refusing to start.
 * A farmer on a slow phone should never see a blank screen because a
 * typeface was late.
 */
export function useAppFonts(): { ready: boolean } {
  const [loaded, error] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_600SemiBold,
    Roboto_700Bold,
    Roboto_800ExtraBold,
  });

  // An error is a reason to carry on, not to wait: React Native falls back to
  // the system font for a family it cannot find.
  return { ready: loaded || error !== null };
}
