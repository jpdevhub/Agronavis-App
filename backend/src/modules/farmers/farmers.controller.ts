import { Request, Response, NextFunction } from 'express';
import { farmerService } from './farmers.service';
import { CreateFarmerInput, UpdateFarmerInput } from './farmers.schema';

export const farmerController = {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const farmer = await farmerService.getByClerkId(req.userId!);
      if (!farmer) {
        return res.status(404).json({ success: false, error: 'Farmer profile not found' });
      }
      res.json({ success: true, data: farmer });
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const farmer = await farmerService.create(req.userId!, req.body as CreateFarmerInput);
      res.status(201).json({ success: true, data: farmer, message: 'Farmer profile created' });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const farmer = await farmerService.update(req.params.id, req.body as UpdateFarmerInput);
      res.json({ success: true, data: farmer, message: 'Farmer profile updated' });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await farmerService.delete(req.params.id);
      res.json({ success: true, message: 'Farmer profile deleted' });
    } catch (error) {
      next(error);
    }
  },
};
