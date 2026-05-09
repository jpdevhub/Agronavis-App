import { z } from 'zod';

export const createFarmerSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  state: z.string().min(1),
  district: z.string().min(1),
  village: z.string().optional(),
  landHolding: z.number().positive().optional(),
  primaryCrops: z.array(z.string()).optional(),
  language: z.enum(['en', 'hi', 'mr', 'pa', 'gu', 'te', 'kn']).default('en'),
  irrigationType: z.string().optional(),
  soilType: z.string().optional(),
});

export const updateFarmerSchema = createFarmerSchema.partial();

export type CreateFarmerInput = z.infer<typeof createFarmerSchema>;
export type UpdateFarmerInput = z.infer<typeof updateFarmerSchema>;
