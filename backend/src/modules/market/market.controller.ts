import type { Request, Response } from 'express';
import { ok } from '../../shared/http';
import { marketService } from './market.service';

export const marketController = {
  async getLivePrices(req: Request, res: Response) {
    const { commodity, state, limit } = req.query as unknown as {
      commodity: string;
      state: string;
      limit: number;
    };
    const data = await marketService.getLivePrices(commodity, state, limit);
    ok(res, data, { count: data.length });
  },

  async getTrend(req: Request, res: Response) {
    const { commodity, state } = req.query as unknown as { commodity: string; state: string };
    const trend = await marketService.getPriceTrend(commodity, state);
    ok(res, trend);
  },

  async getDashboard(req: Request, res: Response) {
    const { state, crops } = req.query as unknown as { state: string; crops: string[] };
    const data = await marketService.getDashboardPrices(state, crops);
    ok(res, data, { count: data.length });
  },
};
