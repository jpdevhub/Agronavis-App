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

export const APPROX_SIZE_GB: Record<ModelVariant, number> = { e4b: 4.4, e2b: 3.1 };

/**
 * Retail "8 GB" phones report 9–11 GB through PlatformConstants because the
 * figure includes kernel and GPU shared memory. Anything at or below this
 * ceiling gets E2B.
 */
const E2B_RAM_CEILING = 12 * 1024 * 1024 * 1024;

/** A partial download must not be mistaken for a usable model. */
const MINIMUM_BYTES: Record<ModelVariant, number> = {
  e4b: 1.5 * 1024 * 1024 * 1024,
  e2b: 0.8 * 1024 * 1024 * 1024,
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
