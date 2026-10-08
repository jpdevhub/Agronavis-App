import path from 'node:path';
import fs from 'node:fs';
import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import type { DiseasePrediction } from '@agronavis/shared-types';
import { logger } from '../../config/logger';

/**
 * Plant disease classification, run inside this process.
 *
 * The model was trained in PyTorch and is served here as ONNX. The original
 * service around it needed torch and CLIP, about 1.1 GB before a request
 * arrives, which will not start on a 512 MB instance. Exported to ONNX the same
 * weights are 43 MB and run under onnxruntime in roughly 120 MB, so the API
 * keeps one service instead of depending on a second one being alive.
 */
const MODEL_DIR = path.join(__dirname, '../../../model');
const MODEL_PATH = path.join(MODEL_DIR, 'plant_disease_resnet18.onnx');
const CLASSES_PATH = path.join(MODEL_DIR, 'class_names.json');

/** ImageNet statistics; the model was fine-tuned on a backbone trained with them. */
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const SIDE = 224;

/**
 * Below this the answer is not worth putting in front of a farmer.
 *
 * The classifier has no way to say "this is not a leaf" — every image is forced
 * into one of 86 classes — so a photograph of a hand or the sky still produces a
 * winner. On random noise the top class came out at 33%, so anything under half
 * is treated as no answer rather than a quiet guess.
 */
const MIN_CONFIDENCE = 0.5;


/**
 * How much of the frame looks like a plant.
 *
 * The classifier must return one of its 86 labels for any image at all, so a
 * photograph of a hand, a wall or the sky still produces a winner — the
 * original service answered this with CLIP, which needs 600 MB of weights and
 * will not start alongside this API on a small instance.
 *
 * The excess green index is the standard cheap test for vegetation in the field
 * and costs one pass over the pixels. It is taken on chromaticity — each channel
 * over the pixel's total — rather than on the raw channels, which makes it a
 * question of colour alone and not of how bright the photograph is. On raw
 * channels a grey wall sits near zero and sensor noise alone pushes a third of
 * its pixels over any low threshold; normalised, grey is zero however noisy or
 * dark it is, and a leaf in shade scores the same as a leaf in sun.
 *
 * It stays green-led on purpose. An earlier version also counted any warm pixel
 * — red above blue, green above blue — so that browning tissue would pass, but
 * that rule is a textbook description of human skin, and a selfie came back as
 * healthy rice at 78%. Skin, bare wood and earth all sit red-dominant with blue
 * high enough to push the index negative, while leaf tissue from deep green
 * through chlorotic yellow keeps blue low enough to stay above it, so the one
 * index separates them without a second rule carving the first one back.
 *
 * What this gives up is fully necrotic tissue — brown, no green left. That
 * photograph is refused with an explanation rather than answered, which is the
 * right way round: a farmer who is told to reframe loses a moment, and a farmer
 * told their face is healthy rice has no reason to trust anything else here.
 */
export function vegetationShare(data: Buffer): number {
  let vegetation = 0;
  const pixels = data.length / 3;

  for (let i = 0; i < data.length; i += 3) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;

    // Near-black pixels carry no usable colour — the ratios below would be
    // mostly sensor noise — so they are counted as not plant rather than
    // amplified into one.
    const total = r + g + b;
    if (total < 90) continue;

    if ((2 * g - r - b) / total > 0.08) vegetation += 1;
  }

  return vegetation / pixels;
}

/**
 * Under this share of the frame, the photograph is treated as not showing a
 * crop. Chosen low on purpose: a farmer holding one leaf against the soil is
 * the normal case, and a wrong rejection is worse than a weak answer the
 * confidence score already qualifies.
 */
const MIN_VEGETATION = 0.15;

let session: ort.InferenceSession | null = null;
let classes: string[] = [];
let loadFailed = false;

/** Loaded once, on the first scan rather than at boot, so a missing model file
 *  cannot stop the API serving everything else. */
async function ready(): Promise<boolean> {
  if (session) return true;
  if (loadFailed) return false;

  try {
    classes = JSON.parse(fs.readFileSync(CLASSES_PATH, 'utf8')) as string[];
    session = await ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all',
    });
    logger.info('Disease model loaded', { classes: classes.length });
    return true;
  } catch (error) {
    loadFailed = true;
    logger.error('Disease model failed to load', { error: (error as Error).message });
    return false;
  }
}

/**
 * Turns "tomato_late_blight" into something a farmer reads.
 *
 * The class key stays on the prediction: it is what the scan is filed under and
 * what the reference library is keyed on.
 */
export function readableClass(key: string): { crop: string; condition: string; healthy: boolean } {
  const title = (s: string) =>
    s.replace(/_/g, ' ').replace(/\b[a-z]/g, (c) => c.toUpperCase()).trim();

  if (key.startsWith('healthy_')) {
    return { crop: title(key.slice('healthy_'.length)), condition: 'Healthy', healthy: true };
  }
  if (key.startsWith('diseased_')) {
    return {
      crop: title(key.slice('diseased_'.length)),
      condition: 'Disease present, not identified',
      healthy: false,
    };
  }

  const parts = key.split('_');
  // The one crop in the set whose name is two words.
  const span = key.startsWith('bell_pepper') ? 2 : 1;
  return {
    crop: title(parts.slice(0, span).join(' ')),
    condition: title(parts.slice(span).join(' ')),
    healthy: false,
  };
}

/** Softmax over the raw logits, so scores read as probabilities. */
function softmax(logits: Float32Array): number[] {
  const max = Math.max(...logits);
  const exps = Array.from(logits, (v) => Math.exp(v - max));
  const total = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / total);
}

/**
 * Classifies a leaf photograph.
 *
 * Returns the three strongest classes rather than one: the farmer, who can see
 * the plant, is better placed to choose between "early blight" and "late
 * blight" than a model working from one photograph.
 */
export async function diagnose(image: Buffer): Promise<DiseasePrediction> {
  if (!(await ready()) || !session) {
    return { available: false, confident: false, plantDetected: true, predictions: [] };
  }

  // Resize to the training geometry and normalise, channel-planar as the model
  // expects (NCHW), which is not the interleaved order sharp returns.
  const { data } = await sharp(image)
    .removeAlpha()
    .resize(SIDE, SIDE, { fit: 'fill' })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Checked on the decoded frame, before the classifier is asked anything: if
  // there is no plant here, its answer is noise whatever its confidence says.
  const plantShare = vegetationShare(data);
  if (plantShare < MIN_VEGETATION) {
    return { available: true, confident: false, plantDetected: false, predictions: [] };
  }

  const pixels = SIDE * SIDE;
  const input = new Float32Array(3 * pixels);
  for (let i = 0; i < pixels; i += 1) {
    for (let c = 0; c < 3; c += 1) {
      input[c * pixels + i] = (data[i * 3 + c]! / 255 - MEAN[c]!) / STD[c]!;
    }
  }

  const output = await session.run({
    image: new ort.Tensor('float32', input, [1, 3, SIDE, SIDE]),
  });

  const logits = output.logits!.data as Float32Array;
  const scores = softmax(logits);

  const ranked = scores
    .map((confidence, index) => ({ confidence, key: classes[index] ?? `class_${index}` }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 3)
    .map(({ key, confidence }) => ({ classKey: key, confidence, ...readableClass(key) }));

  return {
    available: true,
    confident: (ranked[0]?.confidence ?? 0) >= MIN_CONFIDENCE,
    plantDetected: true,
    predictions: ranked,
  };
}
