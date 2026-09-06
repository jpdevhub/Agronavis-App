import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

export const listCropsSchema = z.object({
  fieldId: z.string().uuid().optional(),
  status: z.enum(['active', 'harvested', 'failed']).optional(),
});

export const createCropSchema = z.object({
  farmId: z.string().uuid().optional(),
  fieldId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80),
  variety: z.string().trim().max(80).optional(),
  category: z.string().trim().max(60).optional(),
  sownDate: isoDate.optional(),
  harvestDate: isoDate.optional(),
});

export const updateCropSchema = createCropSchema
  .partial()
  .extend({ status: z.enum(['active', 'harvested', 'failed']).optional() });

export const recordScanSchema = z.object({
  farmId: z.string().uuid().optional(),
  cropId: z.string().uuid().optional(),
  imageUrl: z.string().url(),
  detectedDisease: z.string().trim().max(120).optional(),
  confidence: z.number().min(0).max(1).optional(),
  recommendation: z.string().trim().max(2000).optional(),
});

export const idParamSchema = z.object({ id: z.string().uuid() });
export const classKeyParamSchema = z.object({ classKey: z.string().trim().min(1).max(120) });

export const listVarietiesSchema = z.object({
  cropType: z.string().trim().max(60).optional(),
});

export const listDiseasesSchema = z.object({
  cropType: z.string().trim().max(60).optional(),
  search: z.string().trim().max(80).optional(),
});
