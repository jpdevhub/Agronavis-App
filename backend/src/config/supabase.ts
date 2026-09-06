import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@agronavis/shared-types';
import { env } from './env';

export type Db = SupabaseClient<Database>;

/**
 * Service-role client. Bypasses Row Level Security, so **every** query made
 * through it must scope itself to the caller explicitly — that is what the
 * `assertOwns*` helpers in `shared/ownership.ts` are for.
 */
export const db: Db = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  global: { headers: { 'x-application-name': 'agronavis-api' } },
});

/** Auth admin surface (user lookup, deletion). Same key, narrower intent. */
export const authAdmin = db.auth.admin;
