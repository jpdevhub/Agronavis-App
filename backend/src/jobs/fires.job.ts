import { logger } from '../config/logger';
import { db } from '../config/supabase';
import { buildSmokeAdvisory, insertDrafts, type NearbyFire } from '../modules/advisory/advisory.service';
import { bearingDeg, distanceKm, firesService } from '../modules/fires/fires.service';
import { notificationsService } from '../modules/notifications/notifications.service';
import { weatherService } from '../modules/weather/weather.service';
import { loadPollableFarms } from './farm-locations';

/** How far around a farm to ask FIRMS about. */
const RADIUS_KM = 60;

/**
 * Polls NASA FIRMS for field fires near every mapped farm and warns the ones
 * downwind.
 *
 * Farms are clustered by coordinate to two decimal places, the same way the
 * weather poller does it: a FIRMS box is sixty kilometres across, so two farms
 * in the same village do not need two of them.
 *
 * The whole job is a no-op without a key. That is deliberate — it is an
 * optional feature on a free credential, and nothing else in the poller should
 * notice whether it is configured.
 */
export async function runFirePoll(): Promise<{ farms: number; calls: number; detections: number; advisories: number }> {
  if (!firesService.enabled) {
    logger.info('Fire poll skipped — FIRMS_MAP_KEY is not set');
    return { farms: 0, calls: 0, detections: 0, advisories: 0 };
  }

  const farms = await loadPollableFarms();
  if (farms.length === 0) return { farms: 0, calls: 0, detections: 0, advisories: 0 };

  const clusters = new Map<string, typeof farms>();
  for (const farm of farms) {
    const key = `${farm.latitude.toFixed(2)}:${farm.longitude.toFixed(2)}`;
    const bucket = clusters.get(key);
    if (bucket) bucket.push(farm);
    else clusters.set(key, [farm]);
  }

  let calls = 0;
  let detections = 0;
  let advisories = 0;

  for (const group of clusters.values()) {
    const anchor = group[0]!;
    try {
      const fires = await firesService.near(anchor.latitude, anchor.longitude, RADIUS_KM, 1);
      calls += 1;
      if (fires.length === 0) continue;

      // Kept so the app can show what has been burning without going upstream
      // on every open. Ignoring duplicates makes a re-run of the poller free.
      const rows = fires.map((f) => ({
        latitude: f.latitude,
        longitude: f.longitude,
        brightness_k: f.brightnessK || null,
        confidence: f.confidence,
        acquired_at: acquiredAt(f.acquiredDate, f.acquiredTime),
        source: 'VIIRS_SNPP_NRT',
      }));
      const { error } = await db
        .from('fire_detections')
        .upsert(rows, {
          onConflict: 'latitude,longitude,acquired_at,source',
          ignoreDuplicates: true,
        });
      if (error) logger.warn('Fire detections not stored', { error: error.message });
      else detections += rows.length;

      for (const farm of group) {
        // Each farm measures the same fires from where it actually is: the
        // anchor may be ten kilometres away, which changes both the distance
        // and which side of the farm the smoke is on.
        const near: NearbyFire[] = fires.map((f) => ({
          distanceKm: distanceKm(farm.latitude, farm.longitude, f.latitude, f.longitude),
          bearingDeg: bearingDeg(farm.latitude, farm.longitude, f.latitude, f.longitude),
        }));

        const windFromDeg = await currentWindFrom(farm.latitude, farm.longitude);
        const draft = buildSmokeAdvisory(near, windFromDeg);
        if (!draft) continue;

        // Same path the weather poller uses, so the unique dedupe key keeps a
        // poller that runs several times a day to one warning.
        const created = await insertDrafts(farm.farmerId, farm.farmId, [draft]);
        advisories += created.length;

        for (const advisory of created) {
          await notificationsService.send(farm.farmerId, {
            title: advisory.title,
            body: advisory.body.slice(0, 160),
            type: advisory.category,
            severity: advisory.severity,
            data: { advisoryId: advisory.id, farmId: farm.farmId },
          });
        }
      }
    } catch (error) {
      logger.error('Fire poll failed for a cluster', {
        farmId: anchor.farmId,
        error: (error as Error).message,
      });
    }
  }

  logger.info('Fire poll finished', { farms: farms.length, calls, detections, advisories });
  return { farms: farms.length, calls, detections, advisories };
}

/** FIRMS reports a UTC date and an HHMM time in separate columns. */
export function acquiredAt(date: string, time: string): string {
  const padded = (time || '0000').padStart(4, '0');
  return `${date}T${padded.slice(0, 2)}:${padded.slice(2, 4)}:00.000Z`;
}

/** Today's wind direction, or null if the forecast cannot say. */
async function currentWindFrom(lat: number, lon: number): Promise<number | null> {
  try {
    const forecast = await weatherService.getForecast(lat, lon);
    return forecast[0]?.windFromDeg ?? null;
  } catch {
    // Proximity alone still says something useful.
    return null;
  }
}
