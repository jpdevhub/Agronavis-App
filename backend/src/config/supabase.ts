import {
  createClient,
  type RealtimeClientOptions,
  type SupabaseClient,
} from '@supabase/supabase-js';
import ws from 'ws';
import type { Database } from '@agronavis/shared-types';
import { env } from './env';

export type Db = SupabaseClient<Database>;

// `ws` accepts a null address, which the realtime option's narrower
// constructor type does not describe; the runtime shapes are identical.
type WebSocketTransport = NonNullable<RealtimeClientOptions['transport']>;

/**
 * Service-role client. It bypasses Row Level Security, so every query through
 * it must scope itself to the caller — that is what `shared/ownership.ts` is
 * for.
 *
 * `realtime.transport` is required: supabase-js builds a RealtimeClient inside
 * `createClient`, and on Node below 22 that throws for want of a global
 * WebSocket, killing the process at import time over a feature we never use.
 */
export const db: Db = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  global: { headers: { 'x-application-name': 'agronavis-api' } },
  realtime: { transport: ws as unknown as WebSocketTransport },
});

/** Auth admin surface (user lookup, deletion). Same key, narrower intent. */
export const authAdmin = db.auth.admin;
