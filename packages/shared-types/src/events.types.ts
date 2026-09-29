/** Realtime contract — Socket.IO event names and payloads. */

import type { AdvisoryCategory, AdvisorySeverity, PriceDirection } from './database.types';
import type { CurrentWeather, ForecastDay } from './api.types';

export interface SubscribePayload {
  farmId?: string;
  district?: string;
  farmerId?: string;
  state?: string;
}

export interface WeatherUpdateEvent {
  farmId: string;
  current: CurrentWeather;
  forecast: ForecastDay[];
  updatedAt: string;
}

export interface MarketPriceEvent {
  commodity: string;
  price: number;
  change: number;
  changePct: number;
  direction: PriceDirection;
  market: string;
  state: string;
  updatedAt: string;
}

export interface AdvisoryEvent {
  farmId: string;
  advisory: {
    id: string;
    category: AdvisoryCategory;
    severity: AdvisorySeverity;
    title: string;
    body: string;
    createdAt: string;
  };
}

export interface PestAlertEvent {
  district: string;
  farmId: string | null;
  disease: string;
  confidence: number;
  alertedAt: string;
  message: string;
}

export interface CommunityPostEvent {
  postId: string;
  district: string;
  authorName: string;
  title: string;
  preview: string;
  createdAt: string;
}

export interface NotificationEvent {
  farmerId: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
}

/** Server → client. */
export interface ServerToClientEvents {
  'weather:update': (payload: WeatherUpdateEvent) => void;
  'market:price': (payload: MarketPriceEvent) => void;
  'advisory:new': (payload: AdvisoryEvent) => void;
  'pest:alert': (payload: PestAlertEvent) => void;
  'community:post': (payload: CommunityPostEvent) => void;
  'notification:push': (payload: NotificationEvent) => void;
  'subscribed': (payload: { rooms: string[] }) => void;
}

/** Client → server. */
export interface ClientToServerEvents {
  subscribe: (payload: SubscribePayload) => void;
  unsubscribe: (payload: SubscribePayload) => void;
}

/**
 * Event names as literal types. Deliberately types-only: this package emits no
 * runtime JavaScript, so the compiled API bundle has no dependency on it.
 */
export type ServerEventName = keyof ServerToClientEvents;
export type ClientEventName = keyof ClientToServerEvents;
