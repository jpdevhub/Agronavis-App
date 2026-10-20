import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SahayakMessage } from './useSahayak';

/**
 * Keeps a conversation across a close and reopen, for a while.
 *
 * Leaving Sahayak and coming back lost the thread entirely, which is its own
 * small insult: a farmer who asked three questions about a field and went to
 * look at that field returns to a blank screen.
 *
 * Deliberately not permanent. These are questions about one afternoon's
 * problem, and a chat from three weeks ago surfacing under today's weather
 * would be worse than nothing. Six hours covers a working day; after that it
 * starts clean.
 */
const KEY = 'agronavis.sahayak.thread';
const LIFETIME_MS = 6 * 60 * 60_000;

/** Enough to carry a conversation, not enough to fill the device. */
const MAX_MESSAGES = 40;

interface Stored {
  savedAt: number;
  messages: SahayakMessage[];
}

export async function loadThread(): Promise<SahayakMessage[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Stored;
    if (!parsed?.savedAt || !Array.isArray(parsed.messages)) return [];
    if (Date.now() - parsed.savedAt > LIFETIME_MS) {
      void AsyncStorage.removeItem(KEY).catch(() => {});
      return [];
    }

    // A half-written answer from a killed process is not worth restoring.
    return parsed.messages.filter((m) => m && typeof m.text === 'string' && m.text.length > 0);
  } catch {
    return [];
  }
}

export function saveThread(messages: SahayakMessage[]): void {
  const recent = messages.slice(-MAX_MESSAGES);
  const payload: Stored = { savedAt: Date.now(), messages: recent };
  void AsyncStorage.setItem(KEY, JSON.stringify(payload)).catch(() => {
    // A thread that cannot be written is only a thread that will not come
    // back; nothing about the conversation in progress depends on it.
  });
}

export function clearThread(): void {
  void AsyncStorage.removeItem(KEY).catch(() => {});
}
