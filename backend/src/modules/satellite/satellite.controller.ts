import type { Request, Response } from 'express';
import { farmerId } from '../../middleware/auth.middleware';
import { ok } from '../../shared/http';
import { assertOwnsFarm, assertOwnsField } from '../../shared/ownership';
import { db } from '../../config/supabase';
import { satelliteService } from './satellite.service';

/** Centre of a field the caller owns, or null when it has no boundary yet. */
async function fieldCentre(farmer: string, fieldId: string) {
  await assertOwnsField(farmer, fieldId);
  const { data } = await db
    .from('farm_fields')
    .select('center_latitude, center_longitude')
    .eq('id', fieldId)
    .maybeSingle();

  const lat = data?.center_latitude == null ? null : Number(data.center_latitude);
  const lon = data?.center_longitude == null ? null : Number(data.center_longitude);
  return lat == null || lon == null ? null : { lat, lon };
}

export const satelliteController = {
  /** When Sentinel-2 last saw this field, and how much of it was cloud. */
  async forField(req: Request, res: Response) {
    const centre = await fieldCentre(farmerId(req), req.params.fieldId!);
    if (!centre) {
      ok(res, { passes: [], lastClear: null, nextExpected: null, available: true, mapped: false });
      return;
    }

    const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
    ok(res, { ...(await satelliteService.passesFor(centre.lat, centre.lon, days)), mapped: true });
  },

  /** The same, for a farm with no mapped field — its single stored point. */
  async forFarm(req: Request, res: Response) {
    const farm = await assertOwnsFarm(farmerId(req), req.params.farmId!);
    const lat = Number(farm.latitude);
    const lon = Number(farm.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      ok(res, { passes: [], lastClear: null, nextExpected: null, available: true, mapped: false });
      return;
    }

    const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
    ok(res, { ...(await satelliteService.passesFor(lat, lon, days)), mapped: true });
  },
};
