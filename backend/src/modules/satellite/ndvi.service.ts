import axios from 'axios';
import https from 'node:https';
import proj4 from 'proj4';
import { logger } from '../../config/logger';
import { db } from '../../config/supabase';

/**
 * Crop vigour from Sentinel-2, read straight out of the scene on AWS.
 *
 * NDVI is (NIR − red) / (NIR + red). Healthy leaves reflect near-infrared hard
 * and absorb red for photosynthesis, so the gap between those two bands tracks
 * how much living, growing tissue is under the satellite. Bare soil sits near
 * 0.1-0.2, a closed healthy canopy 0.6-0.9.
 *
 * The scenes are cloud-optimised GeoTIFFs served over plain HTTPS with range
 * requests, which is what makes this affordable: a Sentinel-2 band is over a
 * hundred megabytes, and one field needs a few hundred pixels out of the
 * middle of it. We fetch those bytes and nothing else. No whole-scene
 * download, no band maths on a 512 MB instance, and no account anywhere.
 */
const STAC_URL = 'https://earth-search.aws.element84.com/v1/search';

/** Above this the scene is mostly cloud and the reading would be of cloud. */
const MAX_CLOUD = 20;

/** Half-width of the sample box, metres. 100 m gives 20x20 ten-metre pixels. */
const HALF_M = 100;

/** Render has no IPv6 route out; see the same fix in fires.service.ts. */
const agent = new https.Agent({ family: 4, keepAlive: true });

/**
 * A scene's NDVI never changes once published, so this is cached on the scene
 * rather than on a clock. The first read of a field costs a few seconds; every
 * later one is free until the satellite comes back round.
 */
const cache = new Map<string, NdviReading>();

export interface NdviReading {
  date: string;
  /** Mean NDVI across the sampled pixels, −1 to 1. */
  ndvi: number;
  /** How many pixels carried usable data. */
  pixels: number;
  cloudPercent: number;
}

export interface NdviReport {
  latest: NdviReading | null;
  previous: NdviReading | null;
  /** Change since the previous clear pass, as a fraction. Null without two. */
  change: number | null;
  /** False when the scenes could not be read; never shown as "no growth". */
  available: boolean;
}

export const EMPTY_NDVI: NdviReport = {
  latest: null, previous: null, change: null, available: false,
};

interface Scene {
  id: string;
  date: string;
  cloudPercent: number;
  epsg: number;
  red: string;
  nir: string;
}

/** The recent clear scenes over a point, newest first. */
async function clearScenes(lat: number, lon: number, days: number): Promise<Scene[]> {
  const pad = 0.02;
  const from = new Date(Date.now() - days * 86_400_000).toISOString();

  const { data } = await axios.post<{ features?: StacFeature[] }>(
    STAC_URL,
    {
      collections: ['sentinel-2-l2a'],
      bbox: [lon - pad, lat - pad, lon + pad, lat + pad],
      datetime: `${from}/${new Date().toISOString()}`,
      query: { 'eo:cloud_cover': { lt: MAX_CLOUD } },
      limit: 10,
    },
    { timeout: 25_000, httpsAgent: agent },
  );

  return (data.features ?? [])
    .map((f) => ({
      id: String(f.id ?? ''),
      date: String(f.properties?.datetime ?? '').slice(0, 10),
      cloudPercent: Number(f.properties?.['eo:cloud_cover'] ?? 100),
      epsg: Number(f.properties?.['proj:epsg'] ?? 0),
      red: f.assets?.red?.href ?? '',
      nir: f.assets?.nir?.href ?? '',
    }))
    .filter((s) => s.date && s.epsg && s.red && s.nir)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

/**
 * Mean NDVI over a small box centred on a point.
 *
 * The scene is projected in UTM, so the farmer's latitude and longitude are
 * converted into that zone's metres before they can be turned into pixel
 * offsets. Sentinel-2 tiles each carry their own EPSG, which the catalogue
 * reports per scene — assuming one would put the sample in the wrong country.
 */
async function readScene(scene: Scene, lat: number, lon: number): Promise<NdviReading | null> {
  const key = `${scene.id}:${lat.toFixed(4)}:${lon.toFixed(4)}`;
  const hit = cache.get(key);
  if (hit) return hit;

  // geotiff publishes ESM and a CommonJS build; this file compiles to
  // CommonJS, so it is required rather than imported.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { fromUrl } = require('geotiff') as typeof import('geotiff');

  const [x, y] = proj4('EPSG:4326', `EPSG:${scene.epsg}`, [lon, lat]) as [number, number];

  const bands: Record<'red' | 'nir', ArrayLike<number> | null> = { red: null, nir: null };

  for (const band of ['red', 'nir'] as const) {
    const tiff = await fromUrl(scene[band]);
    const image = await tiff.getImage();
    const [ox, oy] = image.getOrigin();
    const [rx, ry] = image.getResolution();

    const left = Math.round((x - HALF_M - ox) / rx);
    const top = Math.round((y + HALF_M - oy) / ry);
    const side = Math.max(1, Math.round((HALF_M * 2) / Math.abs(rx)));

    const raster = await image.readRasters({ window: [left, top, left + side, top + side] });
    bands[band] = raster[0] as ArrayLike<number>;
  }

  const red = bands.red;
  const nir = bands.nir;
  if (!red || !nir || red.length === 0 || red.length !== nir.length) return null;

  let sum = 0;
  let pixels = 0;
  for (let i = 0; i < red.length; i += 1) {
    const r = red[i]!;
    const n = nir[i]!;
    // Zero in both bands is nodata, not a reading of nothing growing.
    if (r + n === 0) continue;
    sum += (n - r) / (n + r);
    pixels += 1;
  }
  if (pixels === 0) return null;

  const reading: NdviReading = {
    date: scene.date,
    ndvi: Math.round((sum / pixels) * 1000) / 1000,
    pixels,
    cloudPercent: Math.round(scene.cloudPercent * 10) / 10,
  };

  cache.set(key, reading);
  return reading;
}

/**
 * The last two clear readings for a point, and the change between them.
 *
 * Two, because a single NDVI number says little on its own — it moves with the
 * crop, its stage and the season, so 0.4 is excellent for a seedling and
 * alarming for a canopy about to be harvested. A fall between two passes a few
 * days apart is the part that means something.
 */
export async function ndviFor(lat: number, lon: number, days = 30): Promise<NdviReport> {
  try {
    const scenes = (await clearScenes(lat, lon, days)).slice(0, 2);
    if (scenes.length === 0) return { ...EMPTY_NDVI, available: true };

    const readings: NdviReading[] = [];
    for (const scene of scenes) {
      const reading = await readScene(scene, lat, lon);
      if (reading) readings.push(reading);
    }

    const [latest = null, previous = null] = readings;
    return {
      latest,
      previous,
      change:
        latest && previous && previous.ndvi !== 0
          ? Math.round(((latest.ndvi - previous.ndvi) / Math.abs(previous.ndvi)) * 1000) / 1000
          : null,
      available: true,
    };
  } catch (error) {
    logger.warn('NDVI unavailable', { error: (error as Error).message });
    return EMPTY_NDVI;
  }
}

interface StacFeature {
  id?: string;
  properties?: Record<string, unknown>;
  assets?: Record<string, { href?: string }>;
}

/**
 * Readings already computed for a field.
 *
 * This is what the API serves. Nothing here touches AWS: the job has been and
 * done the slow part, so a screen gets its answer in one query.
 */
export async function storedFor(fieldId: string, limit = 12): Promise<NdviReport & {
  history: NdviReading[];
}> {
  const { data, error } = await db
    .from('ndvi_readings')
    .select('captured_on, ndvi, pixels, cloud_percent')
    .eq('field_id', fieldId)
    .order('captured_on', { ascending: false })
    .limit(limit);

  if (error) {
    logger.warn('Stored NDVI unavailable', { error: error.message });
    return { ...EMPTY_NDVI, history: [] };
  }

  const history: NdviReading[] = (data ?? []).map((r) => {
    const row = r as { captured_on: string; ndvi: number; pixels: number; cloud_percent: number | null };
    return {
      date: row.captured_on,
      ndvi: Number(row.ndvi),
      pixels: row.pixels,
      cloudPercent: row.cloud_percent == null ? 0 : Number(row.cloud_percent),
    };
  });

  const [latest = null, previous = null] = history;

  return {
    latest,
    previous,
    change:
      latest && previous && previous.ndvi !== 0
        ? Math.round(((latest.ndvi - previous.ndvi) / Math.abs(previous.ndvi)) * 1000) / 1000
        : null,
    // The query answered. An empty history means no pass has been measured
    // yet, which is a different thing from being unable to look.
    available: true,
    history,
  };
}

export const ndviService = { ndviFor, storedFor, clearScenes, readScene };
