import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ModelVariant } from './modelFile';

/**
 * `createDownloadResumable` can only continue a transfer when it is handed the
 * `resumeData` from a previous attempt. Held in memory it dies with the process,
 * so a 2–3 GB download over a rural connection restarted from zero every time
 * the app was killed. Persisting it is what makes the download finishable.
 */
export interface SavedDownload {
  url: string;
  fileUri: string;
  options: Record<string, unknown>;
  resumeData?: string;
}

const key = (variant: ModelVariant): string => `agronavis_model_download:${variant}`;

export async function saveDownloadState(
  variant: ModelVariant,
  state: SavedDownload,
): Promise<void> {
  try {
    await AsyncStorage.setItem(key(variant), JSON.stringify(state));
  } catch {
    // Losing the checkpoint costs progress, never correctness.
  }
}

export async function loadDownloadState(variant: ModelVariant): Promise<SavedDownload | null> {
  try {
    const raw = await AsyncStorage.getItem(key(variant));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedDownload;
    return parsed.url && parsed.fileUri ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearDownloadState(variant: ModelVariant): Promise<void> {
  try {
    await AsyncStorage.removeItem(key(variant));
  } catch {
    // A stale checkpoint is discarded when the URL no longer matches.
  }
}
