import * as FileSystem from 'expo-file-system/legacy';
import NetInfo from '@react-native-community/netinfo';
import { MODEL_URL, modelFilePath, probeModel, type ModelVariant } from './modelFile';

export interface DownloadProgress {
  receivedBytes: number;
  totalBytes: number;
  /** 0–1, or null while the server has not reported a length. */
  fraction: number | null;
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
 * Downloads a Gemma variant, resuming a partial file rather than restarting.
 * Several gigabytes over a rural connection will be interrupted; starting over
 * each time would make the feature unusable.
 */
export function createModelDownload(
  variant: ModelVariant,
  onProgress: (progress: DownloadProgress) => void,
) {
  const destination = modelFilePath(variant);

  const resumable = FileSystem.createDownloadResumable(
    MODEL_URL[variant],
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
    },
  );

  return {
    destination,
    async start(): Promise<string> {
      const existing = await probeModel(variant);
      if (existing.complete) return existing.path;
      const result = await resumable.downloadAsync();
      if (!result?.uri) throw new Error('The download did not complete.');

      const verified = await probeModel(variant);
      if (!verified.complete) {
        await FileSystem.deleteAsync(destination, { idempotent: true });
        throw new Error('The downloaded file was incomplete and has been removed.');
      }
      return verified.path;
    },
    pause: () => resumable.pauseAsync(),
    resume: () => resumable.resumeAsync(),
  };
}
