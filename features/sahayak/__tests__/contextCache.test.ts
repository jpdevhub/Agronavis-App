import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearContextSnapshot,
  loadContextSnapshot,
  saveContextSnapshot,
  type CachedContext,
} from '../contextCache';

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
  };
});

const context = {
  farmer: { fullName: 'Asha', district: 'Nashik', state: 'Maharashtra' },
  fields: [{ id: 'f1', areaAcres: 2.5 }],
  advisories: [],
} as unknown as CachedContext;

describe('sahayak context snapshot', () => {
  it('round-trips the farm details', async () => {
    await saveContextSnapshot('user-1', context);
    const found = await loadContextSnapshot('user-1');
    expect(found?.context.farmer?.fullName).toBe('Asha');
    expect(found?.savedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('keeps each account separate', async () => {
    await saveContextSnapshot('user-1', context);
    expect(await loadContextSnapshot('user-2')).toBeNull();
  });

  it('returns null rather than throwing on unreadable data', async () => {
    await (AsyncStorage.setItem as jest.Mock)('agronavis_sahayak_context:user-3', 'not json');
    expect(await loadContextSnapshot('user-3')).toBeNull();
  });

  it('clears a snapshot', async () => {
    await saveContextSnapshot('user-4', context);
    await clearContextSnapshot('user-4');
    expect(await loadContextSnapshot('user-4')).toBeNull();
  });
});
