import type { Request, Response } from 'express';
import { farmerId } from '../../middleware/auth.middleware';
import { ok } from '../../shared/http';
import { assertOwnsFarm } from '../../shared/ownership';
import { advisoryService } from './advisory.service';

export const advisoryController = {
  async list(req: Request, res: Response) {
    const id = farmerId(req);
    const { farmId, unreadOnly, limit } = req.query as unknown as {
      farmId?: string;
      unreadOnly?: boolean;
      limit: number;
    };
    if (farmId) await assertOwnsFarm(id, farmId);

    const [data, unread] = await Promise.all([
      advisoryService.list(id, { farmId, unreadOnly, limit }),
      advisoryService.unreadCount(id, farmId),
    ]);
    ok(res, data, { count: unread });
  },

  async listForFarm(req: Request, res: Response) {
    const id = farmerId(req);
    const { farmId } = req.params as { farmId: string };
    await assertOwnsFarm(id, farmId);

    const [data, unread] = await Promise.all([
      advisoryService.list(id, { farmId, limit: 20 }),
      advisoryService.unreadCount(id, farmId),
    ]);
    ok(res, data, { count: unread });
  },

  /** On-demand regeneration — the pull-to-refresh path on the dashboard. */
  async generate(req: Request, res: Response) {
    const id = farmerId(req);
    const { farmId } = req.params as { farmId: string };
    const farm = await assertOwnsFarm(id, farmId);

    const created = await advisoryService.generateForFarm(id, farmId, {
      latitude: farm.latitude ?? 0,
      longitude: farm.longitude ?? 0,
    });

    ok(res, created, { count: created.length });
  },

  async markRead(req: Request, res: Response) {
    ok(res, await advisoryService.markRead(farmerId(req), req.params.id!));
  },

  async markAllRead(req: Request, res: Response) {
    const count = await advisoryService.markAllRead(farmerId(req), req.query.farmId as string | undefined);
    ok(res, { updated: count });
  },

  /**
   * Records a scan result as an advisory for the farmer who took the scan.
   *
   * It used to also warn every other farmer in the district above a confidence
   * threshold, so one detection became an early warning for the whole block.
   * That broadcast went out over the realtime server, which no client ever
   * connected to, and it left with it. Re-delivering it over push is worth
   * doing — it is the most useful thing this endpoint could do — but it is a
   * feature to build, not a line to restore.
   */
  async createPestAdvisory(req: Request, res: Response) {
    const id = farmerId(req);
    const { farmId } = req.params as { farmId: string };
    const { disease, confidence } = req.body as { disease: string; confidence: number };
    await assertOwnsFarm(id, farmId);

    const advisory = await advisoryService.createPestAdvisory(id, farmId, disease, confidence);
    ok(res, advisory, undefined, 201);
  },
};
