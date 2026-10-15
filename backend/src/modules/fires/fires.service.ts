import axios from 'axios';
import { env } from '../../config/env';
import { logger } from '../../config/logger';

/**
 * Active fire detections from NASA FIRMS.
 *
 * Between October and December, Punjab and Haryana burn the stubble left after
 * the rice harvest to clear the ground for wheat. The smoke carries for
 * hundreds of kilometres and the heat sterilises the top centimetres of soil
 * it sits over. A farmer downwind cannot see where it is coming from and gets
 * no warning from anyone.
 *
 * FIRMS publishes what the satellites see, roughly three hours behind. VIIRS
 * is the instrument worth asking: at 375 m it resolves a single burning field,
 * where MODIS at 1 km mostly resolves that something, somewhere, is alight.
 */
const FIRMS_BASE = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv';

/** 375 m, near real time. The resolution a field fire needs. */
const SOURCE = 'VIIRS_SNPP_NRT';

export interface FireDetection {
  latitude: number;
  longitude: number;
  /** Brightness temperature of the fire pixel, kelvin. */
  brightnessK: number;
  /** FIRMS' own confidence: 'l' low, 'n' nominal, 'h' high. */
  confidence: string;
  /** UTC date the satellite saw it. */
  acquiredDate: string;
  /** HHMM, UTC. */
  acquiredTime: string;
}

/** Degrees of latitude per kilometre. Longitude is scaled by the latitude. */
const KM_PER_DEG_LAT = 110.574;

/** A box of `radiusKm` around a point, as FIRMS wants it: W,S,E,N. */
export function boundingBox(lat: number, lon: number, radiusKm: number): string {
  const dLat = radiusKm / KM_PER_DEG_LAT;
  const dLon = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180));
  return [
    (lon - dLon).toFixed(4),
    (lat - dLat).toFixed(4),
    (lon + dLon).toFixed(4),
    (lat + dLat).toFixed(4),
  ].join(',');
}

/**
 * Great-circle distance in kilometres.
 *
 * FIRMS answers for a rectangle; a farmer cares about a radius. Without this
 * a fire in the corner of the box reads as 40 km away when it is nearer 57.
 */
export function distanceKm(
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number,
): number {
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Compass bearing from the first point to the second, in degrees from north.
 *
 * Used against the wind to decide whether smoke is actually coming this way.
 * A fire thirty kilometres downwind is somebody else's problem.
 */
export function bearingDeg(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): number {
  const toRad = (d: number): number => (d * Math.PI) / 180;
  const dLon = toRad(toLon - fromLon);
  const y = Math.sin(dLon) * Math.cos(toRad(toLat));
  const x =
    Math.cos(toRad(fromLat)) * Math.sin(toRad(toLat)) -
    Math.sin(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.cos(dLon);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

/** Smallest angle between two bearings, 0–180. */
export function angleBetween(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Parses the CSV FIRMS returns.
 *
 * Written against the header rather than column position: FIRMS has added
 * columns before, and a silently shifted index would read brightness out of
 * the confidence column and warn about nothing.
 */
export function parseFirmsCsv(csv: string): FireDetection[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0]!.split(',').map((h) => h.trim().toLowerCase());
  const at = (name: string): number => header.indexOf(name);
  const iLat = at('latitude');
  const iLon = at('longitude');
  const iBright = at('bright_ti4');
  const iConf = at('confidence');
  const iDate = at('acq_date');
  const iTime = at('acq_time');

  if (iLat < 0 || iLon < 0 || iDate < 0) {
    logger.warn('FIRMS returned a shape we do not recognise', { header: header.join(',') });
    return [];
  }

  const out: FireDetection[] = [];
  for (const line of lines.slice(1)) {
    const cells = line.split(',');
    const latitude = Number(cells[iLat]);
    const longitude = Number(cells[iLon]);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;

    out.push({
      latitude,
      longitude,
      brightnessK: iBright >= 0 ? Number(cells[iBright]) || 0 : 0,
      confidence: (iConf >= 0 ? cells[iConf] : 'n')?.trim() || 'n',
      acquiredDate: (cells[iDate] ?? '').trim(),
      acquiredTime: (iTime >= 0 ? cells[iTime] : '')?.trim() ?? '',
    });
  }
  return out;
}

export const firesService = {
  /** True when a key is configured. Without one the whole feature stays off. */
  get enabled(): boolean {
    return Boolean(env.FIRMS_MAP_KEY);
  },

  /**
   * Fires seen within `radiusKm` of a point over the last `days`.
   *
   * Returns an empty list rather than throwing: a smoke warning is worth
   * having when it works and must never be the reason the rest of the poller
   * stops running.
   */
  async near(
    lat: number,
    lon: number,
    radiusKm = 60,
    days = 1,
  ): Promise<FireDetection[]> {
    if (!env.FIRMS_MAP_KEY) return [];

    const url = `${FIRMS_BASE}/${env.FIRMS_MAP_KEY}/${SOURCE}/${boundingBox(lat, lon, radiusKm)}/${days}`;
    try {
      const { data } = await axios.get<string>(url, {
        timeout: 20_000,
        responseType: 'text',
      });

      if (typeof data !== 'string' || data.toLowerCase().includes('invalid map_key')) {
        logger.warn('FIRMS rejected the key');
        return [];
      }

      // The box is a rectangle; the farmer's question is a circle.
      return parseFirmsCsv(data).filter(
        (f) => distanceKm(lat, lon, f.latitude, f.longitude) <= radiusKm,
      );
    } catch (error) {
      logger.warn('FIRMS request failed; continuing without fire data', {
        error: (error as Error).message,
      });
      return [];
    }
  },
};
