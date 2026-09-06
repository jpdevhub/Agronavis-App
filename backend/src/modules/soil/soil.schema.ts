import { z } from 'zod';

export const fieldParamSchema = z.object({ fieldId: z.string().uuid() });

export const recordReadingSchema = z.object({
  phLevel: z.number().min(0).max(14).optional(),
  nitrogen: z.number().min(0).max(5000).optional(),
  phosphorus: z.number().min(0).max(5000).optional(),
  potassium: z.number().min(0).max(5000).optional(),
  organicCarbon: z.number().min(0).max(100).optional(),
  moistureLevel: z.number().min(0).max(100).optional(),
  testedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
