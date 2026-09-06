import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { handler } from '../../shared/http';
import { cropsController } from './crops.controller';
import {
  classKeyParamSchema,
  createCropSchema,
  idParamSchema,
  listCropsSchema,
  listDiseasesSchema,
  listVarietiesSchema,
  recordScanSchema,
  updateCropSchema,
} from './crops.schema';

export const cropRoutes = Router();

cropRoutes.use(requireAuth);

cropRoutes.get('/scans', handler(cropsController.listScans));
cropRoutes.post('/scans', validate(recordScanSchema), handler(cropsController.recordScan));
cropRoutes.get('/varieties', validate(listVarietiesSchema, 'query'), handler(cropsController.listVarieties));
cropRoutes.get('/diseases', validate(listDiseasesSchema, 'query'), handler(cropsController.listDiseases));
cropRoutes.get(
  '/diseases/:classKey',
  validate(classKeyParamSchema, 'params'),
  handler(cropsController.getDiseaseReference),
);

cropRoutes.get('/', validate(listCropsSchema, 'query'), handler(cropsController.list));
cropRoutes.post('/', validate(createCropSchema), handler(cropsController.create));
cropRoutes.patch(
  '/:id',
  validate(idParamSchema, 'params'),
  validate(updateCropSchema),
  handler(cropsController.update),
);
cropRoutes.delete('/:id', validate(idParamSchema, 'params'), handler(cropsController.remove));
