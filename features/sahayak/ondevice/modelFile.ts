import * as FileSystem from 'expo-file-system/legacy';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { loadExpectedBytes } from './downloadState';

/**
 * The model Sahayak runs when there is no signal.
 *
 * Online, Sahayak answers from the server (features/sahayak/cloud.ts), so the
 * phone's own model is only the fallback for a field with no network. That
 * changes what it should be: a 2.6 GB download is a wall in front of the chat
 * for a farmer on mobile data, and most never got past it. Gemma 3 1B is about
 * 550 MB and fits in about 1 GB of RAM, so it is the one offered now.
 *
 * Phones that already downloaded a Gemma 4 build keep using it — they paid for
 * that download, and it answers better.
 */
export type ModelVariant = 'g3-1b' | 'e4b' | 'e2b';

/** Android LiteRT-LM loads `.litertlm`; the `-web.task` builds are for WASM. */
const FILENAME: Record<ModelVariant, string> = {
  'g3-1b': 'gemma3-1b-it-int4.litertlm',
  e4b: 'gemma-4-E4B-it.litertlm',
  e2b: 'gemma-4-E2B-it.litertlm',
};

/**
 * Gemma 3 1B sits behind Google's licence click-through on Hugging Face, so a
 * phone cannot fetch it from there without an account. It is served from our
 * own GitHub release instead — the Gemma terms allow redistribution with the
 * terms attached (docs/AI_SETUP.md, "Offline model"). The Gemma 4 builds are
 * published openly by litert-community and stay where they are.
 */
const OFFLINE_MODEL_URL =
  process.env.EXPO_PUBLIC_OFFLINE_MODEL_URL
  || 'https://github.com/jpdevhub/Agronavis-App/releases/download/offline-model-v1/gemma3-1b-it-int4.litertlm';

export const MODEL_URL: Record<ModelVariant, string> = {
  'g3-1b': OFFLINE_MODEL_URL,
  e4b: 'https://huggingface.co/litert-community/gemma-4-E4B-it-litert-lm/resolve/main/gemma-4-E4B-it.litertlm',
  e2b: 'https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm',
};

/**
 * Exact published sizes, read from the Hugging Face `x-linked-size` header
 * rather than rounded off a download progress bar.
 *
 * The self-hosted file's size is whatever was uploaded, so it is either set at
 * build time (EXPO_PUBLIC_OFFLINE_MODEL_BYTES) or recorded from the server's
 * Content-Length when the download starts.
 */
export const EXACT_BYTES: { 'g3-1b': number | null; e4b: number; e2b: number } = {
  'g3-1b': Number(process.env.EXPO_PUBLIC_OFFLINE_MODEL_BYTES) || null,
  e4b: 3_659_530_240,
  e2b: 2_588_147_712,
};

/**
 * Rounded up, never down: someone on a metered connection decides from this.
 * The 1B file is published as 529 MB; 0.55 GB covers it whichever megabyte
 * that meant.
 */
export const APPROX_SIZE_GB: Record<ModelVariant, number> = {
  'g3-1b': 0.55,
  e4b: Math.round((3_659_530_240 / 1e9) * 10) / 10,
  e2b: Math.round((2_588_147_712 / 1e9) * 10) / 10,
};

/** For the download card and the gate, in words a farmer reads. */
export const SIZE_LABEL: Record<ModelVariant, string> = {
  'g3-1b': 'about 550 MB',
  e4b: 'about 3.7 GB',
  e2b: 'about 2.6 GB',
};

/**
 * The whole turn — prompt plus answer — the model can hold. Gemma 3 1B was
 * exported with a 2048-token cache; asking for more fails at load.
 */
export const MAX_TOKENS: Record<ModelVariant, number> = {
  'g3-1b': 2048,
  e4b: 4096,
  e2b: 4096,
};

/**
 * Retail "8 GB" phones report 9–11 GB through PlatformConstants because the
 * figure includes kernel and GPU shared memory. Above this ceiling a phone can
 * hold E4B.
 */
const E4B_RAM_CEILING = 12 * 1024 * 1024 * 1024;

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

/**
 * Only for a 1B file found on disk with no recorded size — copied there by
 * hand, or downloaded before sizes were recorded. Below this it is certainly
 * not the whole model.
 */
const G3_FLOOR_BYTES = 500_000_000;

async function minimumBytes(variant: ModelVariant): Promise<number> {
  const exact = EXACT_BYTES[variant] ?? (await loadExpectedBytes(variant));
  if (exact) return Math.floor(exact * COMPLETE_FRACTION);
  return G3_FLOOR_BYTES;
}

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

/** The model offered for download: the small one, for every phone. */
export function detectModelVariant(): ModelVariant {
  return 'g3-1b';
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
      complete: info.exists && (sizeBytes ?? 0) >= (await minimumBytes(variant)),
    };
  } catch {
    return { variant, path, exists: false, sizeBytes: null, complete: false };
  }
}

/**
 * The best model already on this phone, if any.
 *
 * A Gemma 4 build downloaded before the switch to the small model is kept and
 * preferred — E4B only where there is the memory to run it.
 */
export async function findInstalledModel(): Promise<ModelProbe | null> {
  const memory = deviceMemoryBytes();
  const order: ModelVariant[] = memory !== null && memory > E4B_RAM_CEILING
    ? ['e4b', 'e2b', 'g3-1b']
    : ['e2b', 'g3-1b'];
  for (const variant of order) {
    const probe = await probeModel(variant);
    if (probe.complete) return probe;
  }
  return null;
}

export async function deleteModel(variant: ModelVariant): Promise<void> {
  await FileSystem.deleteAsync(modelFilePath(variant), { idempotent: true });
}
