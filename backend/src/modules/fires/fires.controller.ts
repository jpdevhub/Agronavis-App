import type { Request, Response } from 'express';
import { farmerId } from '../../middleware/auth.middleware';
import { ok } from '../../shared/http';
import { assertOwnsFarm, assertOwnsField } from '../../shared/ownership';
import { db } from '../../config/supabase';
import { weatherService } from '../weather/weather.service';
import {
  angleBetween,
  bearingDeg,
  distanceKm,
  firesService,
  regionFor,
} from './fires.service';

/** Matches the advisory's own arc, so the screen and the alert never disagree. */
const UPWIND_ARC_DEG = 60;

/**
 * The fire report for one point on the earth.
 *
 * Shared by both routes because the only thing that differs between them is
 * where the latitude and longitude come from. Written once so a farm and a
 * field can never answer the same question differently.
 */
async function reportFor(lat: number, lon: number, days: number, radiusKm: number) {
  const [detections, forecast] = await Promise.all([
    firesService.near(lat, lon, radiusKm, days),
    weatherService.getForecast(lat, lon).catch(() => []),
  ]);

  const windFromDeg = forecast[0]?.windFromDeg ?? null;

  const fires = detections
    .map((f) => {
      const bearing = bearingDeg(lat, lon, f.latitude, f.longitude);
      return {
        latitude: f.latitude,
        longitude: f.longitude,
        distanceKm: Math.round(distanceKm(lat, lon, f.latitude, f.longitude) * 10) / 10,
        bearingDeg: Math.round(bearing),
        upwind: windFromDeg === null ? null : angleBetween(bearing, windFromDeg) <= UPWIND_ARC_DEG,
        brightnessK: f.brightnessK,
        confidence: f.confidence,
        acquiredDate: f.acquiredDate,
        acquiredTime: f.acquiredTime,
        region: regionFor(f.latitude, f.longitude),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return {
    mapped: true,
    region: regionFor(lat, lon),
    windFromDeg,
    days,
    radiusKm,
    upwindCount: fires.filter((f) => f.upwind).length,
    fires,
  };
}

const clampDays = (v: unknown) => Math.min(7, Math.max(1, Number(v) || 2));
const clampRadius = (v: unknown) => Math.min(200, Math.max(10, Number(v) || 100));

export const firesController = {
  /**
   * The country-wide picture, for the screen that answers "where in India is
   * this happening". Needs no farm, so it works before a field is mapped.
   */
  async summary(req: Request, res: Response) {
    const days = Math.min(7, Math.max(1, Number(req.query.days) || 1));
    ok(res, await firesService.summary(days));
  },

  /**
   * What is burning around one farm, and whether its smoke is coming this way.
   *
   * Returns the fires themselves rather than a verdict, so the screen can show
   * a farmer where they are and let them judge the ones the arc excluded.
   */
  async near(req: Request, res: Response) {
    const { farmId } = req.params as { farmId: string };
    const farm = await assertOwnsFarm(farmerId(req), farmId);

    const lat = Number(farm.latitude);
    const lon = Number(farm.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      ok(res, { fires: [], windFromDeg: null, upwindCount: 0, region: null, mapped: false });
      return;
    }

    ok(res, await reportFor(lat, lon, clampDays(req.query.days), clampRadius(req.query.radiusKm)));
  },

  /**
   * What is burning around one *field*.
   *
   * A farm carries a single pair of coordinates, fixed by whichever field was
   * mapped first, while its fields can be a thousand kilometres apart — one
   * farm on this system has land in Kolkata and in Ludhiana. Asking the farm
   * meant a farmer standing on their Assam field was shown the fires around
   * Punjab, and told which way the Punjab wind was blowing. Weather already
   * prefers the field for exactly this reason; fires now do too.
   */
  async nearField(req: Request, res: Response) {
    const fieldId = req.params.fieldId!;
    await assertOwnsField(farmerId(req), fieldId);

    const { data: field } = await db
      .from('farm_fields')
      .select('center_latitude, center_longitude')
      .eq('id', fieldId)
      .maybeSingle();

    const lat = field?.center_latitude == null ? null : Number(field.center_latitude);
    const lon = field?.center_longitude == null ? null : Number(field.center_longitude);
    if (lat == null || lon == null || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      ok(res, { fires: [], windFromDeg: null, upwindCount: 0, region: null, mapped: false });
      return;
    }

    ok(res, await reportFor(lat, lon, clampDays(req.query.days), clampRadius(req.query.radiusKm)));
  },

  /** What the poller has stored, for a farm, without going upstream. */
  async history(req: Request, res: Response) {
    const id = farmerId(req);
    const { farmId } = req.params as { farmId: string };
    await assertOwnsFarm(id, farmId);

    const since = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const { data } = await db
      .from('fire_detections')
      .select('acquired_at')
      .gte('acquired_at', since)
      .order('acquired_at', { ascending: false })
      .limit(2000);

    // Fires per day, newest first — enough to say whether it is getting worse.
    const byDay = new Map<string, number>();
    for (const row of data ?? []) {
      const day = String((row as { acquired_at: string }).acquired_at).slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + 1);
    }

    ok(res, {
      days: [...byDay.entries()]
        .map(([date, fires]) => ({ date, fires }))
        .sort((a, b) => (a.date < b.date ? 1 : -1)),
    });
  },
};
