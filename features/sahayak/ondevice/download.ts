import * as FileSystem from 'expo-file-system/legacy';
import NetInfo from '@react-native-community/netinfo';
import { MODEL_URL, modelFilePath, probeModel, type ModelVariant } from './modelFile';
import {
  clearDownloadState,
  loadDownloadState,
  saveDownloadState,
  type SavedDownload,
} from './downloadState';

export interface DownloadProgress {
  receivedBytes: number;
  totalBytes: number;
  /** 0–1, or null while the server has not reported a length. */
  fraction: number | null;
}

/** Checkpointing every callback would hammer storage across a multi-GB file. */
const CHECKPOINT_INTERVAL_MS = 2_000;

/** Enough to ride out a handover or a tunnel, not enough to look stuck. */
const MAX_ATTEMPTS = 6;
const RETRY_BACKOFF_MS = 2_000;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** A pause the farmer asked for is not a failure to retry. */
function isCancellation(error: unknown): boolean {
  const message = (error as Error)?.message ?? '';
  return /pause|cancel|abort(ed)? by/i.test(message);
}

export async function isOnWifi(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.type === 'wifi';
  } catch {
    return false;
  }
}

/**
 * Downloads a Gemma variant, continuing a partial file across app restarts.
 *
 * `createDownloadResumable` only resumes when handed the `resumeData` from the
 * previous attempt, so that checkpoint is persisted as the transfer runs and
 * read back here. Without it, several gigabytes over a rural connection would
 * restart from zero every time the process died, and the download would never
 * finish.
 */
export async function createModelDownload(
  variant: ModelVariant,
  onProgress: (progress: DownloadProgress) => void,
) {
  const destination = modelFilePath(variant);
  const url = MODEL_URL[variant];

  // A checkpoint for a different URL belongs to a superseded model revision.
  const saved = await loadDownloadState(variant);
  const usable = saved && saved.url === url && saved.fileUri === destination ? saved : null;
  if (saved && !usable) {
    await clearDownloadState(variant);
    await FileSystem.deleteAsync(destination, { idempotent: true });
  }

  let lastCheckpoint = 0;

  /**
   * How far the partial file already goes.
   *
   * Android implements resuming as a `Range: bytes=N-` header, and takes N
   * straight from this string — so the bytes already on disk are the whole
   * checkpoint. It is only written out by `pauseAsync`, which a dropped
   * connection never calls, and that is why an interrupted transfer started
   * again from zero.
   */
  const bytesOnDisk = async (): Promise<string | undefined> => {
    const info = await FileSystem.getInfoAsync(destination);
    const size = info.exists ? ((info as { size?: number }).size ?? 0) : 0;
    return size > 0 ? String(size) : undefined;
  };

  const build = (offset?: string) =>
    FileSystem.createDownloadResumable(
    url,
    destination,
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) => {
      onProgress({
        receivedBytes: totalBytesWritten,
        totalBytes: totalBytesExpectedToWrite,
        fraction:
          totalBytesExpectedToWrite > 0
            ? totalBytesWritten / totalBytesExpectedToWrite
            : null,
      });

      const now = Date.now();
      if (now - lastCheckpoint >= CHECKPOINT_INTERVAL_MS) {
        lastCheckpoint = now;
        void saveDownloadState(variant, {
          url,
          fileUri: destination,
          resumeData: String(totalBytesWritten),
        } as SavedDownload);
      }
    },
      offset,
    );

  const resumable = build(usable?.resumeData);

  return {
    destination,
    /** True when this attempt continues bytes already on disk. */
    resuming: usable !== null,

    async start(): Promise<string> {
      const existing = await probeModel(variant);
      if (existing.complete) {
        await clearDownloadState(variant);
        return existing.path;
      }

      /**
       * Several gigabytes over mobile data will be interrupted, more than
       * once. Every attempt after the first picks up from the bytes already
       * written, so an interruption costs seconds rather than the transfer.
       */
      let attempt = 0;
      let active = resumable;
      let continuing = usable !== null;

      for (;;) {
        try {
          const result = continuing
            ? await active.resumeAsync()
            : await active.downloadAsync();
          if (!result?.uri) throw new Error('The download did not complete.');
          break;
        } catch (error) {
          if (isCancellation(error)) throw error;

          attempt += 1;
          const offset = await bytesOnDisk();
          if (offset) {
            await saveDownloadState(variant, {
              url,
              fileUri: destination,
              resumeData: offset,
            } as SavedDownload);
          }

          if (attempt > MAX_ATTEMPTS) {
            throw new Error(
              offset
                ? 'The connection kept dropping. What has downloaded is kept — try again and it carries on.'
                : 'The download could not start. Check the connection and try again.',
            );
          }

          await wait(RETRY_BACKOFF_MS * attempt);
          active = build(offset);
          continuing = Boolean(offset);
        }
      }

      const verified = await probeModel(variant);
      if (!verified.complete) {
        await FileSystem.deleteAsync(destination, { idempotent: true });
        await clearDownloadState(variant);
        throw new Error('The downloaded file was incomplete and has been removed.');
      }

      await clearDownloadState(variant);
      return verified.path;
    },

    async pause(): Promise<void> {
      await resumable.pauseAsync();
      await saveDownloadState(variant, resumable.savable() as SavedDownload);
    },

    resume: () => resumable.resumeAsync(),
  };
}
