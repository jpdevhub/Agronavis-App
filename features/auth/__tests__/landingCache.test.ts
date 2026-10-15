import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearLanding, readLanding, writeLanding } from '../landingCache';

/**
 * This cache is what stops a returning farmer watching a loading screen while
 * a sleeping server boots. It is also what would send them to the wrong screen
 * if it ever returned something it should not — so reads are strict, and a
 * stored value that is not a complete answer is treated as no answer.
 */
jest.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>();
  return {
    getItem: jest.fn(async (k: string) => store.get(k) ?? null),
    setItem: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    removeItem: jest.fn(async (k: string) => void store.delete(k)),
    __store: store,
  };
});

beforeEach(() => {
  (AsyncStorage as unknown as { __store: Map<string, string> }).__store.clear();
  jest.clearAllMocks();
});

describe('landing cache', () => {
  it('returns nothing for a farmer who has not signed in here', async () => {
    expect(await readLanding('nobody')).toBeNull();
  });

  it('round-trips a landing', async () => {
    await writeLanding('u1', { onboardingComplete: true, twoFactorEnabled: false });
    expect(await readLanding('u1')).toEqual({
      onboardingComplete: true,
      twoFactorEnabled: false,
    });
  });

  it('keeps farmers apart', async () => {
    await writeLanding('u1', { onboardingComplete: true, twoFactorEnabled: false });
    expect(await readLanding('u2')).toBeNull();
  });

  it('forgets on sign-out', async () => {
    await writeLanding('u1', { onboardingComplete: true, twoFactorEnabled: true });
    await clearLanding('u1');
    expect(await readLanding('u1')).toBeNull();
  });

  it('treats a half-written value as no value', async () => {
    await AsyncStorage.setItem('landing:u1', JSON.stringify({ twoFactorEnabled: true }));
    expect(await readLanding('u1')).toBeNull();
  });

  it('treats corrupt json as no value rather than throwing', async () => {
    await AsyncStorage.setItem('landing:u1', 'not json');
    expect(await readLanding('u1')).toBeNull();
  });

  it('defaults a missing two-factor flag to off rather than guessing on', async () => {
    await AsyncStorage.setItem('landing:u1', JSON.stringify({ onboardingComplete: true }));
    expect(await readLanding('u1')).toEqual({
      onboardingComplete: true,
      twoFactorEnabled: false,
    });
  });
});
