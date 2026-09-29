import type { Request, Response } from 'express';
import { farmerId } from '../../middleware/auth.middleware';
import { noContent, ok } from '../../shared/http';
import { farmersService } from './farmers.service';

export const farmersController = {
  async getMe(req: Request, res: Response) {
    ok(res, await farmersService.getProfile(farmerId(req), req.user?.email ?? null));
  },

  async updateMe(req: Request, res: Response) {
    ok(res, await farmersService.updateProfile(farmerId(req), req.body));
  },

  async registerPushToken(req: Request, res: Response) {
    await farmersService.registerPushToken(farmerId(req), req.body.token);
    noContent(res);
  },
};
