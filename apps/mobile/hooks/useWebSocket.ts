import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { io, type Socket } from 'socket.io-client';
import type {
  AdvisoryEvent,
  ClientToServerEvents,
  CommunityPostEvent,
  MarketPriceEvent,
  NotificationEvent,
  PestAlertEvent,
  ServerToClientEvents,
  WeatherUpdateEvent,
} from '@agronavis/shared-types';
import { socketUrl } from '@/constants/env';
import { supabase } from '@/utils/supabase';

export type {
  AdvisoryEvent,
  CommunityPostEvent,
  MarketPriceEvent,
  NotificationEvent,
  PestAlertEvent,
  WeatherUpdateEvent,
};

type AgronavisSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// One connection for the whole app. Screens attach listeners to it.
let socket: AgronavisSocket | null = null;

function getSocket(): AgronavisSocket {
  if (socket) return socket;

  socket = io(socketUrl, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 15000,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    autoConnect: true,
    // Read on every attempt so a refreshed token is used after reconnect.
    auth: (cb) => {
      supabase.auth.getSession().then(({ data }) => {
        cb({ token: data.session?.access_token ?? '' });
      });
    },
  });

  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}

export interface UseWebSocketOptions {
  farmId?: string;
  district?: string;
  state?: string;
  onWeatherUpdate?: (event: WeatherUpdateEvent) => void;
  onMarketPrice?: (event: MarketPriceEvent) => void;
  onAdvisory?: (event: AdvisoryEvent) => void;
  onPestAlert?: (event: PestAlertEvent) => void;
  onCommunityPost?: (event: CommunityPostEvent) => void;
  onNotification?: (event: NotificationEvent) => void;
}

export interface WebSocketStatus {
  connected: boolean;
  connecting: boolean;
}

export function useWebSocket(options: UseWebSocketOptions): WebSocketStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<WebSocketStatus>({ connected: false, connecting: true });

  // Callbacks live in a ref so a new inline handler does not tear down the
  // listeners on every render.
  const handlers = useRef(options);
  handlers.current = options;

  const { farmId, district, state } = options;

  const subscribe = useCallback(
    (client: AgronavisSocket) => {
      client.emit('subscribe', { farmId, district, state });
    },
    [farmId, district, state],
  );

  useEffect(() => {
    const client = getSocket();
    setStatus({ connected: client.connected, connecting: !client.connected });

    const onConnect = () => {
      setStatus({ connected: true, connecting: false });
      subscribe(client);
    };
    const onDisconnect = () => setStatus({ connected: false, connecting: true });

    const onWeather = (event: WeatherUpdateEvent) => {
      queryClient.setQueryData(['weather', event.farmId], {
        data: { current: event.current, forecast: event.forecast },
      });
      queryClient.invalidateQueries({ queryKey: ['weather', event.farmId] });
      handlers.current.onWeatherUpdate?.(event);
    };
    const onMarket = (event: MarketPriceEvent) => {
      queryClient.invalidateQueries({ queryKey: ['market'] });
      handlers.current.onMarketPrice?.(event);
    };
    const onAdvisory = (event: AdvisoryEvent) => {
      queryClient.invalidateQueries({ queryKey: ['advisories'] });
      handlers.current.onAdvisory?.(event);
    };
    const onPest = (event: PestAlertEvent) => handlers.current.onPestAlert?.(event);
    const onPost = (event: CommunityPostEvent) => {
      queryClient.invalidateQueries({ queryKey: ['community', 'posts'] });
      handlers.current.onCommunityPost?.(event);
    };
    const onNotification = (event: NotificationEvent) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      handlers.current.onNotification?.(event);
    };

    client.on('connect', onConnect);
    client.on('disconnect', onDisconnect);
    client.on('weather:update', onWeather);
    client.on('market:price', onMarket);
    client.on('advisory:new', onAdvisory);
    client.on('pest:alert', onPest);
    client.on('community:post', onPost);
    client.on('notification:push', onNotification);

    if (client.connected) subscribe(client);
    else client.connect();

    return () => {
      client.off('connect', onConnect);
      client.off('disconnect', onDisconnect);
      client.off('weather:update', onWeather);
      client.off('market:price', onMarket);
      client.off('advisory:new', onAdvisory);
      client.off('pest:alert', onPest);
      client.off('community:post', onPost);
      client.off('notification:push', onNotification);
    };
  }, [queryClient, subscribe]);

  // Reconnect when the app returns to the foreground; mobile OSes kill idle
  // sockets in the background.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next: AppStateStatus) => {
      if (next === 'active' && socket && !socket.connected) socket.connect();
    });
    return () => subscription.remove();
  }, []);

  return status;
}
