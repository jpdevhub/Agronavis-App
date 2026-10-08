import path from 'node:path';
import * as ort from 'onnxruntime-node';
import type { Sharp } from 'sharp';
import { logger } from '../../config/logger';

/**
 * Decides whether a photograph shows a plant at all, before the disease model
 * is allowed an opinion.
 *
 * The disease model cannot do this itself. It was trained on 86 leaf classes
 * and nothing else, so it has no label for "not a leaf" and no score that means
 * one: measured on it directly, a grey wall came back with a higher top logit
 * than a healthy leaf. Every photograph wins a crop, and a farmer was told his
 * own face was healthy rice.
 *
 * NOT WIRED IN YET. The thresholds this would gate on have to be measured
 * against real photographs — leaves across crops and conditions on one side,
 * the things a phone sees indoors on the other — and guessing them risks
 * refusing the diseased leaves this exists to read. Until that calibration is
 * done, diagnose.service.ts gates on colour alone. The weights are not in the
 * repo either: fetch mobilenetv2-12.onnx (14 MB) into backend/model/ from the
 * ONNX model zoo, validated/vision/classification/mobilenet/model.
 *
 * So the question is asked by a model that has actually seen the rest of the
 * world. MobileNetV2 on ImageNet is 14 MB and knows a thousand everyday things,
 * a good share of them leaves, fruit, vegetables, fungi and flowers. Summing
 * what it assigns to those against what it assigns to furniture, clothing and
 * the objects that surround a person indoors answers the question this API
 * actually has, and costs about as much as resizing the image.
 */
const MODEL_PATH = path.join(__dirname, '../../../model/mobilenetv2-12.onnx');

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
const SIDE = 224;

/**
 * ImageNet-1k indices for growing things: vegetables and fruit on the plant,
 * cereal heads, fungi, flowers, and the nursery a crop is photographed in.
 */
const PLANT_CLASSES = new Set([
  738, // flowerpot
  580, // greenhouse
  936, 937, 938, 939, 940, 941, 942, 943, 944, 945, 946, // cabbage … cardoon
  947, // mushroom
  948, 949, 950, 951, 952, 953, 954, 955, 956, 957, // apple … pomegranate
  958, // hay
  984, 985, 986, 987, 988, 989, 990, // rapeseed, daisy, corn, acorn, hip, buckeye
  991, 992, 993, 994, 995, 996, 997, // fungi
  998, // ear of corn
]);

/**
 * ImageNet has no class for a person, so a photograph of one is spread across
 * the things people wear and hold. These are what a selfie actually scores on,
 * and they are strong evidence against a crop however green the frame is.
 */
const PERSON_CLASSES = new Set([
  834, // suit
  837, // sunglasses
  836, // sunglass
  841, // sweatshirt
  610, // jersey, T-shirt
  617, // lab coat
  869, // trench coat
  474, // cardigan
  906, // Windsor tie
  457, // bow tie
  515, // cowboy hat
  808, // sombrero
  433, // bathing cap
  796, // ski mask
  903, // wig
  445, // bikini
  638, // maillot
]);

let session: ort.InferenceSession | null = null;
let loadFailed = false;

/** Loaded on the first scan, so a missing file cannot stop the API booting. */
async function ready(): Promise<boolean> {
  if (session) return true;
  if (loadFailed) return false;
  try {
    session = await ort.InferenceSession.create(MODEL_PATH, {
      executionProviders: ['cpu'],
      graphOptimizationLevel: 'all',
    });
    logger.info('Plant gate model loaded');
    return true;
  } catch (error) {
    loadFailed = true;
    logger.error('Plant gate model failed to load', { error: (error as Error).message });
    return false;
  }
}

export type PlantGate = {
  /** False only when the model was asked and actively disagreed. */
  available: boolean;
  plantScore: number;
  personScore: number;
  topClass: number;
};

/**
 * Scores one already-decoded image. Takes the sharp pipeline rather than a
 * buffer so the photograph is decoded once for both models.
 */
export async function scorePlant(image: Sharp): Promise<PlantGate> {
  if (!(await ready()) || !session) {
    return { available: false, plantScore: 0, personScore: 0, topClass: -1 };
  }

  const { data } = await image
    .clone()
    .resize(SIDE, SIDE, { fit: 'cover' })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const tensor = new Float32Array(3 * SIDE * SIDE);
  const plane = SIDE * SIDE;
  for (let i = 0; i < plane; i++) {
    for (let c = 0; c < 3; c++) {
      tensor[c * plane + i] = (data[i * 3 + c]! / 255 - MEAN[c]!) / STD[c]!;
    }
  }

  const output = await session.run({
    [session.inputNames[0]!]: new ort.Tensor('float32', tensor, [1, 3, SIDE, SIDE]),
  });
  const logits = output[session.outputNames[0]!]!.data as Float32Array;

  const max = Math.max(...logits);
  let total = 0;
  const exps = new Float64Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    exps[i] = Math.exp(logits[i]! - max);
    total += exps[i]!;
  }

  let plantScore = 0;
  let personScore = 0;
  let topClass = 0;
  for (let i = 0; i < exps.length; i++) {
    const p = exps[i]! / total;
    if (PLANT_CLASSES.has(i)) plantScore += p;
    if (PERSON_CLASSES.has(i)) personScore += p;
    if (exps[i]! > exps[topClass]!) topClass = i;
  }

  return { available: true, plantScore, personScore, topClass };
}
