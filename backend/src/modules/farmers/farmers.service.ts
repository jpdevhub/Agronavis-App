import prisma from '../../config/database';
import { CreateFarmerInput, UpdateFarmerInput } from './farmers.schema';
import { AppError } from '../../middleware/error.middleware';

import { IrrigationType, SoilType } from '@prisma/client';

export const farmerService = {
  async getByClerkId(clerkId: string) {
    return prisma.farmer.findUnique({ where: { clerkId } });
  },

  async create(clerkId: string, data: CreateFarmerInput) {
    const existing = await prisma.farmer.findUnique({ where: { clerkId } });
    if (existing) throw new AppError(409, 'Farmer profile already exists');

    return prisma.farmer.create({
      data: {
        ...data,
        clerkId,
        irrigationType: data.irrigationType as IrrigationType | undefined,
        soilType: data.soilType as SoilType | undefined,
      },
    });
  },

  async update(id: string, data: UpdateFarmerInput) {
    const farmer = await prisma.farmer.findUnique({ where: { id } });
    if (!farmer) throw new AppError(404, 'Farmer not found');

    const updateData: any = { ...data };

    return prisma.farmer.update({ where: { id }, data: updateData });
  },

  async delete(id: string) {
    await prisma.farmer.delete({ where: { id } });
  },
};
