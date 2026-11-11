import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Questions asked with no signal and no model on the phone, kept until the
 * network comes back.
 *
 * Refusing the question would teach a farmer that Sahayak only works in town.
 * Keeping it and answering in the same thread once there is signal means the
 * question asked at the edge of the field gets its answer on the walk home.
 *
 * Keyed by farmer, like the thread they belong to, and bounded: a day's worth,
 * not a backlog.
 */
export interface PendingQuestion {
  /** The assistant message waiting for this answer. */
  replyId: string;
  question: string;
  askedAt: number;
}

const key = (userId: string): string => `agronavis.sahayak.pending:${userId}`;
const MAX_PENDING = 10;
/** Older than the thread itself (six hours) is a question nobody is waiting on. */
const LIFETIME_MS = 6 * 60 * 60_000;

export async function loadPending(userId: string): Promise<PendingQuestion[]> {
  try {
    const raw = await AsyncStorage.getItem(key(userId));
    const parsed = raw ? (JSON.parse(raw) as PendingQuestion[]) : [];
    const now = Date.now();
    return Array.isArray(parsed)
      ? parsed.filter((p) => p?.replyId && p.question && now - p.askedAt < LIFETIME_MS)
      : [];
  } catch {
    return [];
  }
}

async function save(userId: string, items: PendingQuestion[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key(userId), JSON.stringify(items.slice(-MAX_PENDING)));
  } catch {
    // Losing the queue loses an answer, never the question already on screen.
  }
}

export async function addPending(userId: string, item: PendingQuestion): Promise<void> {
  const items = await loadPending(userId);
  await save(userId, [...items.filter((p) => p.replyId !== item.replyId), item]);
}

export async function removePending(userId: string, replyId: string): Promise<void> {
  const items = await loadPending(userId);
  await save(userId, items.filter((p) => p.replyId !== replyId));
}

export async function clearPending(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(userId));
  } catch {
    // Expires on its own.
  }
}
