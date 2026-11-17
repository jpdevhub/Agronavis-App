import { createModelDownload } from '../download';

/**
 * A 2.6 GB transfer over mobile data will be interrupted, more than once.
 *
 * Android resumes by sending `Range: bytes=N-`, and takes N from the
 * `resumeData` string — which was only ever written by `pauseAsync`. A
 * dropped connection never calls that, so every interruption started the
 * whole download again and on a real connection it never finished.
 */

const mockDownloadAsync = jest.fn();
const mockResumeAsync = jest.fn();
const mockGetInfoAsync = jest.fn();
/** Each `createDownloadResumable` call, with the offset it was given. */
const mockBuilt: (string | undefined)[] = [];

jest.mock('expo-file-system/legacy', () => ({
  createDownloadResumable: (
    _url: string,
    _dest: string,
    _opts: unknown,
    _onProgress: unknown,
    resumeData?: string,
  ) => {
    mockBuilt.push(resumeData);
    return { downloadAsync: mockDownloadAsync, resumeAsync: mockResumeAsync, pauseAsync: jest.fn(), savable: () => ({}) };
  },
  getInfoAsync: (...args: unknown[]) => mockGetInfoAsync(...args),
  deleteAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@react-native-community/netinfo', () => ({ fetch: jest.fn() }));

const mockProbeModel = jest.fn();
jest.mock('../modelFile', () => ({
  MODEL_URL: { e2b: 'https://example.test/e2b.litertlm' },
  modelFilePath: () => 'file:///models/e2b.litertlm',
  probeModel: (...args: unknown[]) => mockProbeModel(...args),
}));

const mockSaveDownloadState = jest.fn();
jest.mock('../downloadState', () => ({
  loadDownloadState: jest.fn().mockResolvedValue(null),
  saveDownloadState: (...args: unknown[]) => mockSaveDownloadState(...args),
  clearDownloadState: jest.fn().mockResolvedValue(undefined),
}));

const abort = () => new Error('Software caused connection abort');

beforeEach(() => {
  jest.clearAllMocks();
  mockBuilt.length = 0;
  jest.useFakeTimers({ doNotFake: ['nextTick'] });
  mockProbeModel.mockResolvedValue({ complete: false, path: 'file:///models/e2b.litertlm' });
  mockGetInfoAsync.mockResolvedValue({ exists: false });
});

afterEach(() => jest.useRealTimers());

/** Runs the download while letting the retry backoff timers fire. */
async function run(start: () => Promise<string>) {
  const promise = start();
  // Six attempts with a growing backoff; drain the microtasks between each
  // so the awaits inside the retry loop actually settle.
  for (let i = 0; i < 40; i += 1) {
    for (let j = 0; j < 8; j += 1) await Promise.resolve();
    jest.advanceTimersByTime(5_000);
  }
  return promise;
}

describe('an interrupted download', () => {
  it('resumes from the bytes already written instead of starting again', async () => {
    mockDownloadAsync.mockRejectedValueOnce(abort());
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 1_200_000_000 });
    mockResumeAsync.mockResolvedValue({ uri: 'file:///models/e2b.litertlm' });
    mockProbeModel
      .mockResolvedValueOnce({ complete: false, path: '' })
      .mockResolvedValue({ complete: true, path: 'file:///models/e2b.litertlm' });

    const handle = await createModelDownload('e2b' as never, () => {});
    await run(() => handle.start());

    // The second attempt must carry the offset, or it refetches 1.2 GB.
    expect(mockBuilt[1]).toBe('1200000000');
    expect(mockResumeAsync).toHaveBeenCalled();
  });

  it('records the offset so a later app launch can continue', async () => {
    mockDownloadAsync.mockRejectedValueOnce(abort());
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 900_000_000 });
    mockResumeAsync.mockResolvedValue({ uri: 'file:///models/e2b.litertlm' });
    mockProbeModel
      .mockResolvedValueOnce({ complete: false, path: '' })
      .mockResolvedValue({ complete: true, path: 'file:///models/e2b.litertlm' });

    const handle = await createModelDownload('e2b' as never, () => {});
    await run(() => handle.start());

    expect(mockSaveDownloadState).toHaveBeenCalledWith(
      'e2b',
      expect.objectContaining({ resumeData: '900000000' }),
    );
  });

  it('keeps what it has when the connection will not hold', async () => {
    mockDownloadAsync.mockRejectedValue(abort());
    mockResumeAsync.mockRejectedValue(abort());
    mockGetInfoAsync.mockResolvedValue({ exists: true, size: 500_000_000 });

    const handle = await createModelDownload('e2b' as never, () => {});

    // Says the progress is kept, because it is — the next attempt resumes.
    await expect(run(() => handle.start())).rejects.toThrow(/carries on/i);
  });

  it('does not retry a pause the farmer asked for', async () => {
    mockDownloadAsync.mockRejectedValue(new Error('Download was paused'));

    const handle = await createModelDownload('e2b' as never, () => {});
    await expect(run(() => handle.start())).rejects.toThrow(/paused/i);

    // One attempt only: a pause is a decision, not a failure.
    expect(mockBuilt).toHaveLength(1);
  });
});
