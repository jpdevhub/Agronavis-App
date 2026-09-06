import type { Server as HttpServer } from 'http';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { Server as SocketIOServer, type Socket } from 'socket.io';
import type {
  Advisory,
  ClientToServerEvents,
  CommunityPostEvent,
  MarketPriceEvent,
  NotificationEvent,
  ServerToClientEvents,
  WeatherUpdateEvent,
} from '@agronavis/shared-types';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { assertOwnsFarm } from '../shared/ownership';

type AgronavisServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
type AgronavisSocket = Socket<ClientToServerEvents, ServerToClientEvents> & { farmerId?: string };

let io: AgronavisServer | null = null;

const jwks = createRemoteJWKSet(new URL(env.supabaseJwksUrl));
const hmacKey = env.SUPABASE_JWT_SECRET ? new TextEncoder().encode(env.SUPABASE_JWT_SECRET) : null;
const ISSUER = new URL('/auth/v1', env.SUPABASE_URL).toString();

const slug = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, '_');

export const Rooms = {
  farm: (farmId: string) => `farm:${farmId}`,
  district: (district: string) => `district:${slug(district)}`,
  farmer: (farmerId: string) => `farmer:${farmerId}`,
  market: (state: string) => `market:${slug(state)}`,
};

async function verifySocketToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, jwks, { issuer: ISSUER });
    return payload.sub ?? null;
  } catch {
    if (!hmacKey) return null;
  }
  try {
    const { payload } = await jwtVerify(token, hmacKey, { issuer: ISSUER, algorithms: ['HS256'] });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

export function initSocketServer(httpServer: HttpServer): AgronavisServer {
  io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: env.allowedOrigins, credentials: true },
    transports: ['websocket', 'polling'],
    pingTimeout: 20_000,
    pingInterval: 25_000,
    maxHttpBufferSize: 1e6,
  });

  /**
   * Sockets are authenticated at handshake. Without this any client could join
   * `farm:<uuid>` and receive another farmer's advisories — the REST API is
   * guarded, so an unguarded socket would be the way around it.
   */
  io.use(async (socket, next) => {
    const token = (socket.handshake.auth as { token?: string } | undefined)?.token;
    if (!token) return next(new Error('Authentication required'));

    const farmerId = await verifySocketToken(token);
    if (!farmerId) return next(new Error('Invalid or expired session'));

    (socket as AgronavisSocket).farmerId = farmerId;
    next();
  });

  io.on('connection', (socket) => {
    const s = socket as AgronavisSocket;
    logger.debug(`Socket connected: ${s.id}`, { farmerId: s.farmerId });

    // Personal room needs no request — it is derived from the verified token.
    if (s.farmerId) void s.join(Rooms.farmer(s.farmerId));

    s.on('subscribe', (payload) => {
      void (async () => {
        const rooms: string[] = [];
        if (s.farmerId) rooms.push(Rooms.farmer(s.farmerId));

        // Farm rooms are ownership-checked; district and market rooms carry
        // only aggregate, non-personal data and are open to any signed-in user.
        if (payload.farmId && s.farmerId) {
          try {
            await assertOwnsFarm(s.farmerId, payload.farmId);
            rooms.push(Rooms.farm(payload.farmId));
          } catch {
            logger.warn('Rejected farm room subscription', {
              socketId: s.id,
              farmerId: s.farmerId,
              farmId: payload.farmId,
            });
          }
        }
        if (payload.district) rooms.push(Rooms.district(payload.district));
        if (payload.state) rooms.push(Rooms.market(payload.state));

        await Promise.all(rooms.map((room) => s.join(room)));
        s.emit('subscribed', { rooms });
      })();
    });

    s.on('unsubscribe', (payload) => {
      if (payload.farmId) void s.leave(Rooms.farm(payload.farmId));
      if (payload.district) void s.leave(Rooms.district(payload.district));
      if (payload.state) void s.leave(Rooms.market(payload.state));
    });

    s.on('disconnect', (reason) => {
      logger.debug(`Socket disconnected: ${s.id} — ${reason}`);
    });
  });

  logger.info('WebSocket server ready');
  return io;
}

// ── Emitters ─────────────────────────────────────────────────────────────────

export function emitWeatherUpdate(farmId: string, payload: Omit<WeatherUpdateEvent, 'farmId'>): void {
  io?.to(Rooms.farm(farmId)).emit('weather:update', { ...payload, farmId });
}

export function emitMarketPrice(state: string, payload: MarketPriceEvent): void {
  io?.to(Rooms.market(state)).emit('market:price', payload);
}

export function emitAdvisory(farmId: string, advisory: Advisory): void {
  io?.to(Rooms.farm(farmId)).emit('advisory:new', {
    farmId,
    advisory: {
      id: advisory.id,
      category: advisory.category,
      severity: advisory.severity,
      title: advisory.title,
      body: advisory.body,
      createdAt: advisory.createdAt,
    },
  });
}

export function emitPestAlert(
  district: string,
  farmId: string | null,
  disease: string,
  confidence: number,
): void {
  io?.to(Rooms.district(district)).emit('pest:alert', {
    district,
    farmId,
    disease,
    confidence,
    alertedAt: new Date().toISOString(),
    message: `${disease} was detected nearby with ${Math.round(confidence * 100)}% confidence. Check your crop.`,
  });
}

export function emitCommunityPost(district: string, payload: CommunityPostEvent): void {
  io?.to(Rooms.district(district)).emit('community:post', payload);
}

export function emitNotification(farmerId: string, payload: Omit<NotificationEvent, 'farmerId'>): void {
  io?.to(Rooms.farmer(farmerId)).emit('notification:push', { ...payload, farmerId });
}

export function getIO(): AgronavisServer | null {
  return io;
}

export function closeSocketServer(): void {
  io?.close();
  io = null;
}
