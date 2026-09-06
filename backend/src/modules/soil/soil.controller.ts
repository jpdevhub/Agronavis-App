import type { Request, Response } from 'express';
import { farmerId } from '../../middleware/auth.middleware';
import { created, ok } from '../../shared/http';
import { soilService } from './soil.service';

export const soilController = {
  async getForField(req: Request, res: Response) {
    ok(res, await soilService.getForField(farmerId(req), req.params.fieldId!));
  },

  async listHistory(req: Request, res: Response) {
    const data = await soilService.listHistory(farmerId(req), req.params.fieldId!);
    ok(res, data, { count: data.length });
  },

  async recordReading(req: Request, res: Response) {
    created(res, await soilService.recordReading(farmerId(req), req.params.fieldId!, req.body));
  },
};
