import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearThread, loadThread, saveThread } from '../chatHistory';
import type { SahayakMessage } from '../useSahayak';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    setItem: jest.fn((k: string, v: string) => {
      store.set(k, v);
      return Promise.resolve();
    }),
    getItem: jest.fn((k: string) => Promise.resolve(store.get(k) ?? null)),
    removeItem: jest.fn((k: string) => {
      store.delete(k);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store.clear();
      return Promise.resolve();
    }),
  };
});

/**
 * A conversation belongs to the farmer who had it.
 *
 * The thread lived under one key for the whole app, so signing out and
 * signing in as somebody else opened the previous farmer's conversation —
 * their fields, their yields, the problems they had asked about. On a handset
 * shared between a family or a village that is somebody else's business being
 * handed over.
 */

const ALICE = 'farmer-a';
const BOB = 'farmer-b';
const thread = (text: string): SahayakMessage[] => [{ id: '1', role: 'user', text }];

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('a thread is one farmer’s', () => {
  it('comes back for the farmer who wrote it', async () => {
    saveThread(ALICE, thread('when should I irrigate'));
    await flush();

    expect(await loadThread(ALICE)).toHaveLength(1);
  });

  it('is invisible to a different account on the same phone', async () => {
    saveThread(ALICE, thread('my yield last season was poor'));
    await flush();

    expect(await loadThread(BOB)).toEqual([]);
  });

  it('does not disturb the other farmer when one signs out', async () => {
    saveThread(ALICE, thread('alice question'));
    saveThread(BOB, thread('bob question'));
    await flush();

    clearThread(ALICE);
    await flush();

    expect(await loadThread(ALICE)).toEqual([]);
    expect(await loadThread(BOB)).toHaveLength(1);
  });

  it('is gone after it is cleared', async () => {
    saveThread(ALICE, thread('something private'));
    await flush();
    clearThread(ALICE);
    await flush();

    expect(await loadThread(ALICE)).toEqual([]);
  });
});

describe('what is worth bringing back', () => {
  it('forgets a thread older than the working day', async () => {
    await AsyncStorage.setItem(
      `agronavis.sahayak.thread:${ALICE}`,
      JSON.stringify({ savedAt: Date.now() - 7 * 60 * 60_000, messages: thread('yesterday') }),
    );

    // A chat from three weeks ago surfacing under today's weather is worse
    // than starting clean.
    expect(await loadThread(ALICE)).toEqual([]);
  });

  it('keeps one from earlier the same afternoon', async () => {
    await AsyncStorage.setItem(
      `agronavis.sahayak.thread:${ALICE}`,
      JSON.stringify({ savedAt: Date.now() - 60_000, messages: thread('an hour ago') }),
    );

    expect(await loadThread(ALICE)).toHaveLength(1);
  });

  it('drops a half-written answer from a killed process', async () => {
    saveThread(ALICE, [
      { id: '1', role: 'user', text: 'a question' },
      { id: '2', role: 'assistant', text: '' },
    ]);
    await flush();

    expect(await loadThread(ALICE)).toHaveLength(1);
  });

  it('survives corrupted storage rather than failing the screen', async () => {
    await AsyncStorage.setItem(`agronavis.sahayak.thread:${ALICE}`, 'not json');

    expect(await loadThread(ALICE)).toEqual([]);
  });
});
