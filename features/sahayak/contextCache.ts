import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FarmerContext } from './farmerContext';

/**
 * Gemma runs on the device, so Sahayak answers with no signal — but the farm
 * details behind its answers come from react-query, which keeps nothing across
 * restarts. Without this, opening Sahayak offline gives a model that works
 * perfectly and knows nothing about the farm.
 *
 * Keyed by user id: the Supabase session is restored from storage on cold start,
 * so the id is available offline, and a second account never reads the first's
 * snapshot.
 */
export type CachedContext = Pick<
  FarmerContext,
  'farmer' | 'fields' | 'weather' | 'soil' | 'advisories'
>;

export interface ContextSnapshot {
  context: CachedContext;
  savedAt: string;
}

const key = (userId: string): string => `agronavis_sahayak_context:${userId}`;

export async function saveContextSnapshot(userId: string, context: CachedContext): Promise<void> {
  const snapshot: ContextSnapshot = { context, savedAt: new Date().toISOString() };
  try {
    await AsyncStorage.setItem(key(userId), JSON.stringify(snapshot));
  } catch {
    // A failed snapshot only costs offline context, never the live answer.
  }
}

export async function loadContextSnapshot(userId: string): Promise<ContextSnapshot | null> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ContextSnapshot;
    return parsed.context ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearContextSnapshot(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(userId));
  } catch {
    // Nothing to do — a stale snapshot is replaced on the next successful load.
  }
}
