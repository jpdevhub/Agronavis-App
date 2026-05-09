import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

/**
 * Hook to get the device's current GPS coordinates.
 * Requests location permission on first use.
 */
export function useLocation(): LocationState {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let mounted = true;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (mounted) {
          setState((s) => ({ ...s, error: 'Location permission denied', loading: false }));
        }
        return;
      }

      try {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (mounted) {
          setState({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            error: null,
            loading: false,
          });
        }
      } catch (err) {
        if (mounted) {
          setState((s) => ({ ...s, error: 'Failed to get location', loading: false }));
        }
      }
    })();

    return () => { mounted = false; };
  }, []);

  return state;
}
