import type { Request, Response } from 'express';
import { farmerId } from '../../middleware/auth.middleware';
import { badRequest } from '../../shared/errors';
import { ok } from '../../shared/http';
import { assertOwnsFarm } from '../../shared/ownership';
import { weatherService } from './weather.service';

export const weatherController = {
  async getBundle(req: Request, res: Response) {
    const { lat, lon } = req.query as unknown as { lat: number; lon: number };
    ok(res, await weatherService.getBundle(lat, lon));
  },

  async getCurrent(req: Request, res: Response) {
    const { lat, lon } = req.query as unknown as { lat: number; lon: number };
    ok(res, await weatherService.getCurrent(lat, lon));
  },

  async getForecast(req: Request, res: Response) {
    const { lat, lon } = req.query as unknown as { lat: number; lon: number };
    const data = await weatherService.getForecast(lat, lon);
    ok(res, data, { count: data.length });
  },

  async getSolar(req: Request, res: Response) {
    const { lat, lon, days } = req.query as unknown as { lat: number; lon: number; days: number };
    const data = await weatherService.getSolar(lat, lon, days);
    ok(res, data, { count: data.length });
  },

  /**
   * Weather for a farm the caller owns, by id — no coordinates in the URL.
   * Falls back to the stored snapshot when the upstream provider is down, so
   * the dashboard shows yesterday's reading instead of an error card.
   */
  async getForFarm(req: Request, res: Response) {
    const farm = await assertOwnsFarm(farmerId(req), req.params.farmId!);
    if (farm.latitude == null || farm.longitude == null) {
      throw badRequest('This farm has no location yet. Map a field first.');
    }

    try {
      const bundle = await weatherService.getBundle(farm.latitude, farm.longitude);
      await weatherService.saveSnapshot(farm.id, bundle);
      ok(res, bundle);
    } catch (error) {
      const snapshot = await weatherService.getSnapshot(farm.id);
      if (!snapshot) throw error;
      ok(res, snapshot, { cached: true });
    }
  },
};
