import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useAuthStore } from '@/store/useAuthStore';
import { mapNetInfoToConnectivity, type Connectivity } from './connectivity';

interface ConnectivityValue {
  status: Connectivity;
  isOnline: boolean;
  /** Increments on every offline → online transition, for sync effects. */
  reconnectCount: number;
}

const ConnectivityContext = createContext<ConnectivityValue>({
  status: 'online',
  isOnline: true,
  reconnectCount: 0,
});

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Connectivity>('online');
  const [reconnectCount, setReconnectCount] = useState(0);
  const setOffline = useAuthStore((s) => s.setOffline);

  useEffect(() => {
    function apply(next: Connectivity | null) {
      if (next === null) return;
      setStatus((previous) => {
        if (previous !== 'online' && next === 'online') {
          setReconnectCount((n) => n + 1);
        }
        return next;
      });
    }

    if (Platform.OS === 'web') {
      const read = () =>
        apply(typeof navigator === 'undefined' || navigator.onLine ? 'online' : 'offline');
      read();
      window.addEventListener('online', read);
      window.addEventListener('offline', read);
      return () => {
        window.removeEventListener('online', read);
        window.removeEventListener('offline', read);
      };
    }

    return NetInfo.addEventListener((state) => apply(mapNetInfoToConnectivity(state)));
  }, []);

  // The auth store already exposes isOffline; keep it the single read point.
  useEffect(() => {
    setOffline(status === 'offline');
  }, [status, setOffline]);

  const value = useMemo<ConnectivityValue>(
    () => ({ status, isOnline: status === 'online', reconnectCount }),
    [status, reconnectCount],
  );

  return <ConnectivityContext.Provider value={value}>{children}</ConnectivityContext.Provider>;
}

export const useConnectivity = (): ConnectivityValue => useContext(ConnectivityContext);
