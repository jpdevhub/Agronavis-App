import { requireNativeModule } from "expo-modules-core";
import type { EventSubscription } from "expo-modules-core";

type NativeGemma = {
  load: (modelPath: string) => Promise<boolean>;
  generate: (prompt: string) => Promise<string>;
  generateWithImage: (prompt: string, imageBase64: string, mimeType: string) => Promise<string>;
  cancel: () => void;
  addListener?: (eventName: string, listener: (event: unknown) => void) => EventSubscription;
  removeListeners?: (count: number) => void;
};

let native: NativeGemma | null = null;
try {
  native = requireNativeModule<NativeGemma>("GemmaLlm");
} catch {
  native = null;
}

export function isNativeGemmaModuleLinked(): boolean {
  return native != null;
}

export const loadModel = (modelPath: string): Promise<boolean> => {
  if (!native) {
    return Promise.reject(new Error("GemmaLlm native module not linked; run prebuild."));
  }
  return native.load(modelPath);
};

export const generateText = (prompt: string): Promise<string> => {
  if (!native) {
    return Promise.reject(new Error("GemmaLlm native module not linked."));
  }
  return native.generate(prompt);
};

export const generateTextWithImage = (
  prompt: string,
  imageBase64: string,
  mimeType: string,
): Promise<string> => {
  if (!native) {
    return Promise.reject(new Error("GemmaLlm native module not linked."));
  }
  return native.generateWithImage(prompt, imageBase64, mimeType);
};

export const cancelGeneration = (): void => {
  native?.cancel();
};

export function addTokenListener(
  cb: (token: string, done: boolean) => void,
): EventSubscription {
  if (!native?.addListener) {
    return { remove: () => {} };
  }
  return native.addListener("onToken", (event: unknown) => {
    const { token, done } = event as { token: string; done: boolean };
    cb(token, done);
  });
}
