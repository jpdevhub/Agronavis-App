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

/**
 * The size the server said the model is, recorded as the download starts.
 *
 * The self-hosted offline model has no size baked into the app, and without one
 * a download cut short looks the same as a finished one — the failure the
 * completeness check exists to catch.
 */
const sizeKey = (variant: ModelVariant): string => `agronavis_model_size:${variant}`;

export async function saveExpectedBytes(variant: ModelVariant, bytes: number): Promise<void> {
  if (!(bytes > 0)) return;
  try {
    await AsyncStorage.setItem(sizeKey(variant), String(Math.floor(bytes)));
  } catch {
    // Without it the floor in modelFile.ts still applies.
  }
}

export async function loadExpectedBytes(variant: ModelVariant): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(sizeKey(variant));
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  } catch {
    return null;
  }
}
