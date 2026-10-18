import * as FileSystem from 'expo-file-system/legacy';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

/** E4B is the larger, more capable variant; E2B fits smaller phones. */
export type ModelVariant = 'e4b' | 'e2b';

/** Android LiteRT-LM loads `.litertlm`; the `-web.task` builds are for WASM. */
const FILENAME: Record<ModelVariant, string> = {
  e4b: 'gemma-4-E4B-it.litertlm',
  e2b: 'gemma-4-E2B-it.litertlm',
};

/** Published by litert-community. Open weights, no account, no key. */
export const MODEL_URL: Record<ModelVariant, string> = {
  e4b: 'https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it.litertlm',
  e2b: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm',
};

/**
 * Exact published sizes, read from the Hugging Face `x-linked-size` header
 * rather than rounded off a download progress bar.
 */
export const EXACT_BYTES: Record<ModelVariant, number> = {
  e4b: 3_659_530_240,
  e2b: 2_588_147_712,
};

/** For the download card, which talks in gigabytes. */
export const APPROX_SIZE_GB: Record<ModelVariant, number> = {
  e4b: Math.round((EXACT_BYTES.e4b / 1e9) * 10) / 10,
  e2b: Math.round((EXACT_BYTES.e2b / 1e9) * 10) / 10,
};

/**
 * Retail "8 GB" phones report 9–11 GB through PlatformConstants because the
 * figure includes kernel and GPU shared memory. Anything at or below this
 * ceiling gets E2B.
 */
const E2B_RAM_CEILING = 12 * 1024 * 1024 * 1024;

/** A partial download must not be mistaken for a usable model. */
/**
 * What counts as a finished download.
 *
 * This was 1.5 GB for a file of 3.66 GB — less than half. A download cut
 * short by a dropped signal, a backgrounded app or a full disk was therefore
 * recorded as complete, and the runtime then failed on it with
 * "TF_LITE_PREFILL_DECODE not found in the model": the signature it wanted was
 * in the part that never arrived. The error named the model, so it read like
 * an incompatible build rather than half a file.
 *
 * A whole model is its published size. The small tolerance covers a server
 * re-encoding the same weights, not a missing gigabyte.
 */
const COMPLETE_FRACTION = 0.995;

const MINIMUM_BYTES: Record<ModelVariant, number> = {
  e4b: Math.floor(EXACT_BYTES.e4b * COMPLETE_FRACTION),
  e2b: Math.floor(EXACT_BYTES.e2b * COMPLETE_FRACTION),
};

export function modelFilePath(variant: ModelVariant): string {
  return `${FileSystem.documentDirectory ?? ''}${FILENAME[variant]}`;
}

/**
 * Total device RAM in bytes, or null where the platform will not say.
 *
 * React Native's `PlatformConstants` does not carry `totalMemory` on Android,
 * so reading it there silently yields null and every phone would be treated as
 * small. expo-device asks the OS properly.
 */
export function deviceMemoryBytes(): number | null {
  if (Platform.OS !== 'android') return null;
  const total = Device.totalMemory;
  return typeof total === 'number' && total > 0 ? total : null;
}

/** Picks the variant this device can actually hold in memory. */
export function detectModelVariant(): ModelVariant {
  const memory = deviceMemoryBytes();
  if (memory === null) return 'e2b';
  return memory > E2B_RAM_CEILING ? 'e4b' : 'e2b';
}

export interface ModelProbe {
  variant: ModelVariant;
  path: string;
  exists: boolean;
  sizeBytes: number | null;
  complete: boolean;
}

/** Whether a usable model is already on disk, and how big it is. */
export async function probeModel(variant: ModelVariant): Promise<ModelProbe> {
  const path = modelFilePath(variant);
  try {
    const info = await FileSystem.getInfoAsync(path);
    const sizeBytes = info.exists && 'size' in info ? (info.size as number) : null;
    return {
      variant,
      path,
      exists: info.exists,
      sizeBytes,
      complete: info.exists && (sizeBytes ?? 0) >= MINIMUM_BYTES[variant],
    };
  } catch {
    return { variant, path, exists: false, sizeBytes: null, complete: false };
  }
}

export async function deleteModel(variant: ModelVariant): Promise<void> {
  await FileSystem.deleteAsync(modelFilePath(variant), { idempotent: true });
}
