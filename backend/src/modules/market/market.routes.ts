import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import { handler } from '../../shared/http';
import { marketController } from './market.controller';
import { dashboardSchema, livePricesSchema, trendSchema } from './market.schema';

export const marketRoutes = Router();

marketRoutes.use(requireAuth);

marketRoutes.get('/prices', validate(livePricesSchema, 'query'), handler(marketController.getLivePrices));
marketRoutes.get('/trend', validate(trendSchema, 'query'), handler(marketController.getTrend));
marketRoutes.get('/dashboard', validate(dashboardSchema, 'query'), handler(marketController.getDashboard));
