import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'agronavis_pending_mutations';

/**
 * Only actions that are safe to replay later belong in the queue. Each carries
 * the id of the thing it acts on, so a repeat tap replaces rather than stacks.
 */
export type MutationInput =
  | { kind: 'task.complete'; targetId: string }
  | { kind: 'task.skip'; targetId: string }
  | { kind: 'advisory.read'; targetId: string };

export type PendingMutation = MutationInput & { id: string; queuedAt: string };

export async function readQueue(): Promise<PendingMutation[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as PendingMutation[]) : [];
  } catch {
    return [];
  }
}

async function write(queue: PendingMutation[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(queue));
}

/**
 * Queues an action taken offline. Re-queuing the same target replaces the
 * earlier entry, so tapping a task twice cannot send it twice.
 */
export async function enqueue(mutation: MutationInput): Promise<void> {
  const queue = (await readQueue()).filter(
    (m) => !(m.kind === mutation.kind && m.targetId === mutation.targetId),
  );
  queue.push({
    ...mutation,
    id: `${mutation.kind}:${mutation.targetId}`,
    queuedAt: new Date().toISOString(),
  });
  await write(queue);
}

export async function removeFromQueue(ids: string[]): Promise<void> {
  const remaining = (await readQueue()).filter((m) => !ids.includes(m.id));
  await write(remaining);
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
