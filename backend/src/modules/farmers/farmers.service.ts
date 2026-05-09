import prisma from '../../config/database';
import { CreateFarmerInput, UpdateFarmerInput } from './farmers.schema';
import { AppError } from '../../middleware/error.middleware';

export const farmerService = {
  async getByClerkId(clerkId: string) {
    return prisma.farmer.findUnique({ where: { clerkId } });
  },

  async create(clerkId: string, data: CreateFarmerInput) {
    const existing = await prisma.farmer.findUnique({ where: { clerkId } });
    if (existing) throw new AppError(409, 'Farmer profile already exists');

    return prisma.farmer.create({
      data: { ...data, clerkId },
    });
  },

  async update(id: string, data: UpdateFarmerInput) {
    const farmer = await prisma.farmer.findUnique({ where: { id } });
    if (!farmer) throw new AppError(404, 'Farmer not found');

    return prisma.farmer.update({ where: { id }, data });
  },

  async delete(id: string) {
    await prisma.farmer.delete({ where: { id } });
  },
};
