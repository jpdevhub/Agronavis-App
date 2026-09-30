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

  const resumable = FileSystem.createDownloadResumable(
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
        void saveDownloadState(variant, resumable.savable() as SavedDownload);
      }
    },
    usable?.resumeData,
  );

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

      const result = usable
        ? await resumable.resumeAsync()
        : await resumable.downloadAsync();

      if (!result?.uri) throw new Error('The download did not complete.');

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
