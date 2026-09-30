import {
  clearDownloadState,
  loadDownloadState,
  saveDownloadState,
  type SavedDownload,
} from '../ondevice/downloadState';

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

const state: SavedDownload = {
  url: 'https://example.test/gemma-4-E2B-it.litertlm',
  fileUri: 'file:///models/e2b.litertlm',
  options: {},
  resumeData: 'abc123',
};

describe('model download checkpoint', () => {
  it('round-trips the resume data that makes a restart continue', async () => {
    await saveDownloadState('e2b', state);
    const found = await loadDownloadState('e2b');
    expect(found?.resumeData).toBe('abc123');
    expect(found?.fileUri).toBe(state.fileUri);
  });

  it('keeps the two variants apart', async () => {
    await saveDownloadState('e2b', state);
    expect(await loadDownloadState('e4b')).toBeNull();
  });

  it('rejects a checkpoint missing the fields needed to resume', async () => {
    await saveDownloadState('e4b', { resumeData: 'orphan' } as unknown as SavedDownload);
    expect(await loadDownloadState('e4b')).toBeNull();
  });

  it('clears a checkpoint once the file is complete', async () => {
    await saveDownloadState('e2b', state);
    await clearDownloadState('e2b');
    expect(await loadDownloadState('e2b')).toBeNull();
  });
});
