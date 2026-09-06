import type { NutrientLevel, SoilHealth, SoilHealthRow } from '@agronavis/shared-types';
import { logger } from '../../config/logger';
import { db } from '../../config/supabase';
import { fromPostgrest } from '../../shared/errors';
import { assertOwnsField } from '../../shared/ownership';

/**
 * Soil Health Card thresholds in kg/ha. Each nutrient has its own bands - the
 * previous code applied nitrogen's to all three and read phosphorus as Low
 * for every field in the country.
 */
const THRESHOLDS: Record<'nitrogen' | 'phosphorus' | 'potassium', [number, number]> = {
  nitrogen: [280, 560],
  phosphorus: [10, 25],
  potassium: [110, 280],
};

function classify(nutrient: keyof typeof THRESHOLDS, value: number | null): NutrientLevel {
  if (value === null || Number.isNaN(value)) return 'N/A';
  const [low, high] = THRESHOLDS[nutrient];
  if (value >= high) return 'High';
  if (value >= low) return 'Medium';
  return 'Low';
}

function toSoilHealth(row: SoilHealthRow, source: 'lab' | 'regional'): SoilHealth {
  const nitrogen = row.nitrogen === null ? null : Number(row.nitrogen);
  const phosphorus = row.phosphorus === null ? null : Number(row.phosphorus);
  const potassium = row.potassium === null ? null : Number(row.potassium);

  return {
    source,
    phLevel: row.ph_level === null ? null : Number(row.ph_level),
    nitrogen,
    phosphorus,
    potassium,
    organicCarbon: row.organic_carbon === null ? null : Number(row.organic_carbon),
    moistureLevel: row.moisture_level === null ? null : Number(row.moisture_level),
    testedDate: row.tested_date,
    levels: {
      nitrogen: classify('nitrogen', nitrogen),
      phosphorus: classify('phosphorus', phosphorus),
      potassium: classify('potassium', potassium),
    },
  };
}

async function latestReading(fieldId: string): Promise<SoilHealthRow | null> {
  const { data, error } = await db
    .from('soil_health_history')
    .select('*')
    .eq('field_id', fieldId)
    .order('tested_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw fromPostgrest(error, 'Load soil reading');
  return (data as SoilHealthRow) ?? null;
}

export const soilService = {
  /** Soil health for a field. */
  async getForField(farmerId: string, fieldId: string): Promise<SoilHealth | null> {
    const farmId = await assertOwnsField(farmerId, fieldId);

    const existing = await latestReading(fieldId);
    if (existing) {
      // A row the estimator wrote carries no tested_date of its own beyond today;
      // treat a reading with no organic carbon and no moisture as regional.
      const isEstimate = existing.organic_carbon === null && existing.moisture_level === null;
      return toSoilHealth(existing, isEstimate ? 'regional' : 'lab');
    }

    const { data: location } = await db
      .from('farms')
      .select('state, district, farmers!inner(state, district)')
      .eq('id', farmId)
      .maybeSingle<{ state: string | null; district: string | null; farmers: { state: string | null; district: string | null } }>();

    const state = location?.state ?? location?.farmers?.state;
    const district = location?.district ?? location?.farmers?.district;
    if (!state || !district) return null;

    const { error: rpcError } = await db.rpc('get_estimated_soil_health', {
      p_state: state,
      p_district: district,
      p_farm_id: farmId,
      p_field_id: fieldId,
    });
    if (rpcError) {
      logger.warn('Regional soil estimate failed', { fieldId, error: rpcError.message });
      return null;
    }

    const estimated = await latestReading(fieldId);
    return estimated ? toSoilHealth(estimated, 'regional') : null;
  },

  async listHistory(farmerId: string, fieldId: string, limit = 12): Promise<SoilHealth[]> {
    await assertOwnsField(farmerId, fieldId);
    const { data, error } = await db
      .from('soil_health_history')
      .select('*')
      .eq('field_id', fieldId)
      .order('tested_date', { ascending: false })
      .limit(limit);
    if (error) throw fromPostgrest(error, 'List soil history');
    return (data ?? []).map((row) => toSoilHealth(row as SoilHealthRow, 'lab'));
  },

  async recordReading(
    farmerId: string,
    fieldId: string,
    reading: {
      phLevel?: number;
      nitrogen?: number;
      phosphorus?: number;
      potassium?: number;
      organicCarbon?: number;
      moistureLevel?: number;
      testedDate?: string;
    },
  ): Promise<SoilHealth> {
    const farmId = await assertOwnsField(farmerId, fieldId);
    const { data, error } = await db
      .from('soil_health_history')
      .insert({
        farm_id: farmId,
        field_id: fieldId,
        ph_level: reading.phLevel ?? null,
        nitrogen: reading.nitrogen ?? null,
        phosphorus: reading.phosphorus ?? null,
        potassium: reading.potassium ?? null,
        organic_carbon: reading.organicCarbon ?? null,
        moisture_level: reading.moistureLevel ?? null,
        tested_date: reading.testedDate ?? new Date().toISOString().slice(0, 10),
      })
      .select('*')
      .single();
    if (error) throw fromPostgrest(error, 'Save soil reading');
    return toSoilHealth(data as SoilHealthRow, 'lab');
  },
};
