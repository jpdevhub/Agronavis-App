import type {
  Crop,
  CropDiseaseRow,
  CropRow,
  CropScan,
  CropScanRow,
  CropStatus,
  CropVariety,
  CropVarietyRow,
  DiseaseReference,
} from '@agronavis/shared-types';
import { db } from '../../config/supabase';
import { fromPostgrest, notFound } from '../../shared/errors';
import { assertOwnsFarm, assertOwnsField, getOrCreateDefaultFarm, listOwnedFarmIds } from '../../shared/ownership';

function toCrop(row: CropRow): Crop {
  return {
    id: row.id,
    farmId: row.farm_id,
    fieldId: row.field_id,
    name: row.name,
    variety: row.variety,
    category: row.category,
    sownDate: row.sown_date,
    harvestDate: row.harvest_date,
    status: row.status,
    createdAt: row.created_at,
  };
}

function toScan(row: CropScanRow): CropScan {
  return {
    id: row.id,
    farmId: row.farm_id,
    cropId: row.crop_id,
    imageUrl: row.image_url,
    detectedDisease: row.detected_disease,
    confidence: row.confidence_score,
    recommendation: row.recommendation,
    scannedAt: row.scan_date,
  };
}

function toVariety(row: CropVarietyRow): CropVariety {
  return {
    id: row.id,
    cropType: row.crop_type,
    cropCategory: row.crop_category,
    variety: row.variety,
    seasons: row.season ?? [],
    growthDurationDays: row.growth_duration_days,
    avgYieldPerAcre: row.avg_yield_per_acre,
    yieldUnit: row.yield_unit,
    waterRequirementMm: row.water_req_mm_per_season,
    idealPh: { min: row.ideal_ph_min, max: row.ideal_ph_max },
    nutrientsKgPerAcre: {
      n: row.req_nitrogen_kg_per_acre,
      p: row.req_phosphorus_kg_per_acre,
      k: row.req_potassium_kg_per_acre,
    },
  };
}

function toDisease(row: CropDiseaseRow): DiseaseReference {
  return {
    id: row.id,
    classKey: row.class_key,
    name: row.name,
    cropType: row.crop_type,
    isHealthy: row.is_healthy,
    severity: row.severity,
    description: row.description,
    symptoms: row.symptoms ?? [],
    treatment: row.treatment ?? [],
    imageUrl: row.image_url,
  };
}

export interface CreateCropPayload {
  farmId?: string;
  fieldId?: string;
  name: string;
  variety?: string;
  category?: string;
  sownDate?: string;
  harvestDate?: string;
}

export const cropsService = {
  async list(farmerId: string, filters: { fieldId?: string; status?: CropStatus } = {}): Promise<Crop[]> {
    let query = db
      .from('crops')
      .select('*')
      .eq('farmer_id', farmerId)
      .order('created_at', { ascending: false });
    if (filters.fieldId) query = query.eq('field_id', filters.fieldId);
    if (filters.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw fromPostgrest(error, 'List crops');
    return (data ?? []).map((row) => toCrop(row as CropRow));
  },

  /**
   * Creates a crop. The `generate_crop_timeline` trigger in migration 0003
   * fans this out into the farm's task list automatically.
   */
  async create(farmerId: string, payload: CreateCropPayload): Promise<Crop> {
    const farmId = payload.fieldId
      ? await assertOwnsField(farmerId, payload.fieldId)
      : payload.farmId
        ? (await assertOwnsFarm(farmerId, payload.farmId)).id
        : await getOrCreateDefaultFarm(farmerId);

    const { data, error } = await db
      .from('crops')
      .insert({
        farm_id: farmId,
        farmer_id: farmerId,
        field_id: payload.fieldId ?? null,
        name: payload.name,
        variety: payload.variety ?? null,
        category: payload.category ?? null,
        sown_date: payload.sownDate ?? null,
        harvest_date: payload.harvestDate ?? null,
      })
      .select('*')
      .single();
    if (error) throw fromPostgrest(error, 'Create crop');
    return toCrop(data as CropRow);
  },

  async update(
    farmerId: string,
    cropId: string,
    patch: Partial<CreateCropPayload> & { status?: CropStatus },
  ): Promise<Crop> {
    const update: Partial<CropRow> = {};
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.variety !== undefined) update.variety = patch.variety;
    if (patch.category !== undefined) update.category = patch.category;
    if (patch.sownDate !== undefined) update.sown_date = patch.sownDate;
    if (patch.harvestDate !== undefined) update.harvest_date = patch.harvestDate;
    if (patch.status !== undefined) update.status = patch.status;

    const { data, error } = await db
      .from('crops')
      .update(update)
      .eq('id', cropId)
      .eq('farmer_id', farmerId)
      .select('*')
      .maybeSingle();
    if (error) throw fromPostgrest(error, 'Update crop');
    if (!data) throw notFound('Crop not found');
    return toCrop(data as CropRow);
  },

  async remove(farmerId: string, cropId: string): Promise<void> {
    const { error } = await db.from('crops').delete().eq('id', cropId).eq('farmer_id', farmerId);
    if (error) throw fromPostgrest(error, 'Delete crop');
  },

  // ── Disease scans ─────────────────────────────────────────────────────────

  async listScans(farmerId: string, limit = 20): Promise<CropScan[]> {
    const farmIds = await listOwnedFarmIds(farmerId);
    if (farmIds.length === 0) return [];

    const { data, error } = await db
      .from('crop_scans')
      .select('*')
      .in('farm_id', farmIds)
      .order('scan_date', { ascending: false })
      .limit(limit);
    if (error) throw fromPostgrest(error, 'List scans');
    return (data ?? []).map((row) => toScan(row as CropScanRow));
  },

  async recordScan(
    farmerId: string,
    payload: {
      farmId?: string;
      cropId?: string;
      imageUrl: string;
      detectedDisease?: string;
      confidence?: number;
      recommendation?: string;
    },
  ): Promise<CropScan> {
    const farmId = payload.farmId
      ? (await assertOwnsFarm(farmerId, payload.farmId)).id
      : await getOrCreateDefaultFarm(farmerId);

    const { data, error } = await db
      .from('crop_scans')
      .insert({
        farm_id: farmId,
        crop_id: payload.cropId ?? null,
        image_url: payload.imageUrl,
        detected_disease: payload.detectedDisease ?? 'Pending Analysis',
        confidence_score: payload.confidence ?? null,
        recommendation: payload.recommendation ?? null,
      })
      .select('*')
      .single();
    if (error) throw fromPostgrest(error, 'Save scan');
    return toScan(data as CropScanRow);
  },

  // ── Reference data ────────────────────────────────────────────────────────

  /** The agronomy catalogue: what can be grown, and what each variety needs. */
  async listVarieties(cropType?: string): Promise<CropVariety[]> {
    let query = db
      .from('crop_varieties')
      .select('*')
      .order('crop_type', { ascending: true })
      .order('variety', { ascending: true });
    if (cropType) query = query.ilike('crop_type', cropType);

    const { data, error } = await query;
    if (error) throw fromPostgrest(error, 'List crop varieties');
    return (data ?? []).map((row) => toVariety(row as CropVarietyRow));
  },

  /** The disease library — symptoms and treatment steps, searchable by name. */
  async listDiseases(filters: { cropType?: string; search?: string } = {}): Promise<DiseaseReference[]> {
    let query = db
      .from('crop_diseases')
      .select('*')
      .order('crop_type', { ascending: true })
      .order('name', { ascending: true });
    if (filters.cropType) query = query.ilike('crop_type', filters.cropType);
    if (filters.search) query = query.ilike('name', `%${filters.search}%`);

    const { data, error } = await query;
    if (error) throw fromPostgrest(error, 'List crop diseases');
    return (data ?? []).map((row) => toDisease(row as CropDiseaseRow));
  },

  /** Reference card for one class — symptoms and treatment steps. */
  async getDiseaseReference(classKey: string): Promise<DiseaseReference> {
    const { data, error } = await db
      .from('crop_diseases')
      .select('*')
      .eq('class_key', classKey)
      .maybeSingle();
    if (error) throw fromPostgrest(error, 'Load disease reference');
    if (!data) throw notFound('No reference entry for that disease');
    return toDisease(data as CropDiseaseRow);
  },
};
