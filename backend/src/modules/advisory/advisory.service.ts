import type {
  Advisory,
  AdvisoryCategory,
  AdvisoryRow,
  AdvisorySeverity,
  ForecastDay,
  Json,
  SolarDay,
} from '@agronavis/shared-types';
import { logger } from '../../config/logger';
import { db } from '../../config/supabase';
import { fromPostgrest, notFound } from '../../shared/errors';
import { assertOwnsFarm } from '../../shared/ownership';
import { waterDeficit, weatherService } from '../weather/weather.service';

function toAdvisory(row: AdvisoryRow): Advisory {
  return {
    id: row.id,
    farmId: row.farm_id,
    fieldId: row.field_id,
    category: row.category,
    severity: row.severity,
    title: row.title,
    body: row.body,
    source: row.source,
    read: row.read,
    validUntil: row.valid_until,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

interface DraftAdvisory {
  category: AdvisoryCategory;
  severity: AdvisorySeverity;
  title: string;
  body: string;
  source: string;
  dedupeKey: string;
  validUntil?: string;
  metadata?: Record<string, unknown>;
}

const today = (): string => new Date().toISOString().slice(0, 10);
const hoursFromNow = (h: number): string => new Date(Date.now() + h * 3_600_000).toISOString();

// ── Rules ────────────────────────────────────────────────────────────────────

/**
 * Irrigation advice from the FAO-56 water balance: ET₀ leaving the field minus
 * rainfall entering it, accumulated over the last three days.
 */
export function buildIrrigationAdvisory(deficitMm: number): DraftAdvisory | null {
  const rounded = Math.round(deficitMm * 10) / 10;

  if (rounded > 18) {
    return {
      category: 'irrigation',
      severity: 'critical',
      title: 'Irrigate today',
      body: `Your field has lost ${rounded} mm more water than it received over the last three days. That is severe stress for most crops — irrigate today, ideally before 9 am, and apply roughly ${Math.round(rounded)} mm (${Math.round(rounded * 4.05)} m³ per acre).`,
      source: 'fao56_penman_monteith',
      dedupeKey: `irrigation:${today()}`,
      validUntil: hoursFromNow(24),
      metadata: { deficitMm: rounded, recommendedMm: Math.round(rounded) },
    };
  }
  if (rounded > 10) {
    return {
      category: 'irrigation',
      severity: 'high',
      title: 'Irrigate within 48 hours',
      body: `A ${rounded} mm water deficit has built up over three days. Schedule irrigation in the next two days — about ${Math.round(rounded)} mm will bring the root zone back to field capacity.`,
      source: 'fao56_penman_monteith',
      dedupeKey: `irrigation:${today()}`,
      validUntil: hoursFromNow(48),
      metadata: { deficitMm: rounded, recommendedMm: Math.round(rounded) },
    };
  }
  if (rounded > 4) {
    return {
      category: 'irrigation',
      severity: 'medium',
      title: 'Check soil moisture',
      body: `A mild ${rounded} mm deficit is building. Dig 15 cm down — if the soil crumbles rather than holding together, irrigate within three days.`,
      source: 'fao56_penman_monteith',
      dedupeKey: `irrigation:${today()}`,
      validUntil: hoursFromNow(72),
      metadata: { deficitMm: rounded },
    };
  }
  // A satisfied water balance is not news; do not fill the inbox with it.
  return null;
}

export function buildWeatherAdvisory(forecast: ForecastDay[]): DraftAdvisory | null {
  const heavyRain = forecast.find((d) => d.rainMm > 30 || d.rainProbability >= 80);
  if (heavyRain) {
    return {
      category: 'weather_alert',
      severity: heavyRain.rainMm > 60 ? 'critical' : 'high',
      title: 'Heavy rain expected',
      body: `${heavyRain.rainMm} mm of rain is forecast on ${heavyRain.date} (${heavyRain.rainProbability}% chance). Hold back fertiliser and pesticide — both will wash off. Clear your field drains today.`,
      source: 'openweathermap',
      dedupeKey: `weather:rain:${heavyRain.date}`,
      validUntil: `${heavyRain.date}T23:59:59.000Z`,
      metadata: { date: heavyRain.date, rainMm: heavyRain.rainMm },
    };
  }

  const extremeHeat = forecast.find((d) => d.tempMax >= 42);
  if (extremeHeat) {
    return {
      category: 'weather_alert',
      severity: extremeHeat.tempMax >= 45 ? 'critical' : 'high',
      title: 'Extreme heat warning',
      body: `${extremeHeat.tempMax}°C expected on ${extremeHeat.date}. Irrigate before sunrise or after sunset only, and mulch exposed soil to cut evaporation. Flowering crops may drop pollen above 40°C.`,
      source: 'openweathermap',
      dedupeKey: `weather:heat:${extremeHeat.date}`,
      validUntil: `${extremeHeat.date}T23:59:59.000Z`,
      metadata: { date: extremeHeat.date, tempMax: extremeHeat.tempMax },
    };
  }

  const highWind = forecast.find((d) => d.windSpeed >= 45);
  if (highWind) {
    return {
      category: 'weather_alert',
      severity: 'medium',
      title: 'High wind advisory',
      body: `Winds up to ${highWind.windSpeed} km/h on ${highWind.date}. Do not spray — drift will waste the chemical and damage neighbouring fields. Stake tall crops and secure shade nets.`,
      source: 'openweathermap',
      dedupeKey: `weather:wind:${highWind.date}`,
      validUntil: `${highWind.date}T23:59:59.000Z`,
      metadata: { date: highWind.date, windSpeed: highWind.windSpeed },
    };
  }

  return null;
}

/**
 * Prolonged leaf wetness with warm nights is the classic blast/blight window.
 * Flagging the conditions is cheaper for the farmer than treating the outbreak.
 */
export function buildDiseaseRiskAdvisory(forecast: ForecastDay[]): DraftAdvisory | null {
  const risky = forecast.filter(
    (d) => d.humidity >= 85 && d.tempMin >= 18 && d.tempMax <= 32,
  );
  if (risky.length < 2) return null;

  return {
    category: 'pest_control',
    severity: 'medium',
    title: 'Fungal disease risk rising',
    body: `${risky.length} of the next five days are humid (>85%) and mild — the conditions blast and blight need. Scout the lower leaves every morning, and keep a preventive spray ready rather than waiting for visible lesions.`,
    source: 'openweathermap',
    dedupeKey: `disease_risk:${risky[0]!.date}`,
    validUntil: hoursFromNow(120),
    metadata: { riskDays: risky.map((d) => d.date) },
  };
}

export function buildPestAdvisory(disease: string, confidence: number): DraftAdvisory {
  const pct = Math.round(confidence * 100);
  return {
    category: 'pest_control',
    severity: confidence >= 0.85 ? 'critical' : confidence >= 0.65 ? 'high' : 'medium',
    title: `${disease} detected (${pct}% confidence)`,
    body: `A crop scan identified ${disease} at ${pct}% confidence. Inspect the plants around where you took the photo, remove and burn badly affected leaves, and confirm the diagnosis with your block agriculture officer before spraying.`,
    source: 'ai_scan',
    dedupeKey: `pest:${disease.toLowerCase().replace(/\s+/g, '_')}:${today()}`,
    validUntil: hoursFromNow(168),
    metadata: { disease, confidence },
  };
}

// ── Persistence ──────────────────────────────────────────────────────────────

async function insertDrafts(
  farmerId: string,
  farmId: string,
  drafts: DraftAdvisory[],
): Promise<Advisory[]> {
  if (drafts.length === 0) return [];

  const rows = drafts.map((d) => ({
    farmer_id: farmerId,
    farm_id: farmId,
    category: d.category,
    severity: d.severity,
    title: d.title,
    body: d.body,
    source: d.source,
    dedupe_key: d.dedupeKey,
    valid_until: d.validUntil ?? null,
    metadata: (d.metadata ?? {}) as Json,
  }));

  // `uq_advisories_farm_dedupe` makes this idempotent: the weather poller runs
  // 48 times a day and must not create 48 copies of "irrigate today".
  const { data, error } = await db
    .from('advisories')
    .upsert(rows, { onConflict: 'farm_id,dedupe_key', ignoreDuplicates: true })
    .select('*');

  if (error) throw fromPostgrest(error, 'Create advisories');
  return (data ?? []).map((row) => toAdvisory(row as AdvisoryRow));
}

export const advisoryService = {
  toAdvisory,

  async list(
    farmerId: string,
    options: { farmId?: string; unreadOnly?: boolean; limit?: number } = {},
  ): Promise<Advisory[]> {
    let query = db
      .from('advisories')
      .select('*')
      .eq('farmer_id', farmerId)
      // Hide advisories whose window has closed — yesterday's rain warning is noise.
      .or(`valid_until.is.null,valid_until.gte.${new Date().toISOString()}`)
      .order('created_at', { ascending: false })
      .limit(options.limit ?? 20);

    if (options.farmId) query = query.eq('farm_id', options.farmId);
    if (options.unreadOnly) query = query.eq('read', false);

    const { data, error } = await query;
    if (error) throw fromPostgrest(error, 'List advisories');

    const severityRank: Record<AdvisorySeverity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    // Order by urgency first, recency second. Postgres cannot sort by the CHECK
    // enum's semantic order, so it happens here.
    return (data ?? [])
      .map((row) => toAdvisory(row as AdvisoryRow))
      .sort(
        (a, b) =>
          severityRank[a.severity] - severityRank[b.severity] ||
          b.createdAt.localeCompare(a.createdAt),
      );
  },

  async unreadCount(farmerId: string, farmId?: string): Promise<number> {
    let query = db
      .from('advisories')
      .select('id', { count: 'exact', head: true })
      .eq('farmer_id', farmerId)
      .eq('read', false);
    if (farmId) query = query.eq('farm_id', farmId);
    const { count, error } = await query;
    if (error) throw fromPostgrest(error, 'Count advisories');
    return count ?? 0;
  },

  async markRead(farmerId: string, advisoryId: string): Promise<Advisory> {
    const { data, error } = await db
      .from('advisories')
      .update({ read: true })
      .eq('id', advisoryId)
      .eq('farmer_id', farmerId) // ownership enforced in the predicate
      .select('*')
      .maybeSingle();
    if (error) throw fromPostgrest(error, 'Update advisory');
    if (!data) throw notFound('Advisory not found');
    return toAdvisory(data as AdvisoryRow);
  },

  async markAllRead(farmerId: string, farmId?: string): Promise<number> {
    let query = db.from('advisories').update({ read: true }).eq('farmer_id', farmerId).eq('read', false);
    if (farmId) query = query.eq('farm_id', farmId);
    const { data, error } = await query.select('id');
    if (error) throw fromPostgrest(error, 'Update advisories');
    return (data ?? []).length;
  },

  /**
   * Runs every rule against current conditions for one farm and stores whatever
   * fires. Returns only the advisories that are new, which is what the caller
   * pushes over the WebSocket.
   */
  async generateForFarm(
    farmerId: string,
    farmId: string,
    coords?: { latitude: number; longitude: number },
  ): Promise<Advisory[]> {
    const location = coords ?? (await assertOwnsFarm(farmerId, farmId));
    if (location.latitude == null || location.longitude == null) return [];

    let forecast: ForecastDay[] = [];
    let solar: SolarDay[] = [];
    try {
      [forecast, solar] = await Promise.all([
        weatherService.getForecast(location.latitude, location.longitude),
        weatherService.getSolar(location.latitude, location.longitude, 5),
      ]);
    } catch (error) {
      logger.warn('Advisory generation skipped — weather unavailable', {
        farmId,
        error: (error as Error).message,
      });
      return [];
    }

    const drafts: DraftAdvisory[] = [];

    const deficit = waterDeficit(solar, 3);
    if (deficit !== null) {
      const irrigation = buildIrrigationAdvisory(deficit);
      if (irrigation) drafts.push(irrigation);
    }

    const weather = buildWeatherAdvisory(forecast);
    if (weather) drafts.push(weather);

    const disease = buildDiseaseRiskAdvisory(forecast);
    if (disease) drafts.push(disease);

    return insertDrafts(farmerId, farmId, drafts);
  },

  async createPestAdvisory(
    farmerId: string,
    farmId: string,
    disease: string,
    confidence: number,
  ): Promise<Advisory | null> {
    const [advisory] = await insertDrafts(farmerId, farmId, [
      buildPestAdvisory(disease, confidence),
    ]);
    return advisory ?? null;
  },
};
