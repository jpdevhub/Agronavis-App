import axios from 'axios';
import { logger } from '../config/logger';
import { db } from '../config/supabase';

/**
 * The Soil Health Card portal is a React app over a GraphQL API that answers
 * without a credential. It publishes the district nutrient tables the scheme
 * collects, which is the same data the hand-written seed in 0004 came from —
 * only for all 34 states and UTs rather than five.
 */
const API = 'https://soilhealth4.dac.gov.in';

const HEADERS = {
  'Content-Type': 'application/json',
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  Origin: 'https://soilhealth.dac.gov.in',
  Referer: 'https://soilhealth.dac.gov.in/',
};

const STATES_QUERY = 'query GetState { getState }';

const NUTRIENTS_QUERY = `query GetNutrientDashboardForPortal($state: ID, $cycle: String) {
  getNutrientDashboardForPortal(state: $state, cycle: $cycle)
}`;

/**
 * Cycles to read, newest first — pinned rather than derived from the date.
 *
 * A district takes the newest cycle that reports it. The current cycle is still
 * being collected, so it covers only part of the country; without the earlier
 * ones behind it, every district not yet resampled would have no figures at all.
 *
 * These need bumping when the portal moves on. `npm run sync:soil 2027-28`
 * overrides the list for one run; the constant should then be updated to match.
 */
const CYCLES = ['2026-27', '2025-26', '2024-25'];

/** Counts of samples falling in each class, as the portal reports them. */
type Band = Record<string, number | undefined>;

interface NutrientRow {
  cycle?: string;
  district?: { name?: string } | null;
  results?: {
    n?: Band; p?: Band; k?: Band;
    OC?: Band; pH?: Band; EC?: Band;
    S?: Band; Fe?: Band; Zn?: Band; Cu?: Band; B?: Band; Mn?: Band;
  } | null;
}

interface StateRow {
  _id: string;
  name: string;
}

export interface SoilRow {
  State: string;
  District: string;
  Cycle: string | null;
  n_high: number; n_medium: number; n_low: number;
  p_high: number; p_medium: number; p_low: number;
  k_high: number; k_medium: number; k_low: number;
  OC_High: number; OC_Medium: number; OC_Low: number;
  pH_Alkaline: number; pH_Acidic: number; pH_Neutral: number;
  EC_NonSaline: number; EC_Saline: number;
  S_Sufficient: number; S_Deficient: number;
  Fe_Sufficient: number; Fe_Deficient: number;
  Zn_Sufficient: number; Zn_Deficient: number;
  Cu_Sufficient: number; Cu_Deficient: number;
  B_Sufficient: number; B_Deficient: number;
  Mn_Sufficient: number; Mn_Deficient: number;
}

async function graphql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const { data } = await axios.post<{ data: T; errors?: { message: string }[] }>(
    API,
    { query, variables },
    { headers: HEADERS, timeout: 90_000 },
  );
  if (data.errors?.length) throw new Error(data.errors[0].message);
  return data.data;
}

/** "ANDHRA PRADESH" reads badly in the UI; the lookup lower-cases anyway. */
export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

const num = (band: Band | undefined, key: string): number => {
  const value = band?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
};

/**
 * Folds the portal's rows into one per district.
 *
 * A district is reported once per sub-scheme — Karnataka returns 120 rows for
 * 31 districts — and those are separate sample sets from the same place, so the
 * counts add. The estimate function sums multiple rows for a district anyway;
 * doing it here keeps the table one row per district.
 */
export function foldNutrientRows(stateName: string, rows: NutrientRow[]): SoilRow[] {
  const byDistrict = new Map<string, SoilRow>();

  for (const row of rows) {
    const name = row.district?.name?.trim();
    if (!name) continue;

    const key = name.toLowerCase();
    const r = row.results ?? {};
    const existing = byDistrict.get(key);

    const add: SoilRow = existing ?? {
      State: titleCase(stateName),
      District: titleCase(name),
      Cycle: row.cycle ?? null,
      n_high: 0, n_medium: 0, n_low: 0,
      p_high: 0, p_medium: 0, p_low: 0,
      k_high: 0, k_medium: 0, k_low: 0,
      OC_High: 0, OC_Medium: 0, OC_Low: 0,
      pH_Alkaline: 0, pH_Acidic: 0, pH_Neutral: 0,
      EC_NonSaline: 0, EC_Saline: 0,
      S_Sufficient: 0, S_Deficient: 0,
      Fe_Sufficient: 0, Fe_Deficient: 0,
      Zn_Sufficient: 0, Zn_Deficient: 0,
      Cu_Sufficient: 0, Cu_Deficient: 0,
      B_Sufficient: 0, B_Deficient: 0,
      Mn_Sufficient: 0, Mn_Deficient: 0,
    };

    add.n_high += num(r.n, 'High');   add.n_medium += num(r.n, 'Medium');   add.n_low += num(r.n, 'Low');
    add.p_high += num(r.p, 'High');   add.p_medium += num(r.p, 'Medium');   add.p_low += num(r.p, 'Low');
    add.k_high += num(r.k, 'High');   add.k_medium += num(r.k, 'Medium');   add.k_low += num(r.k, 'Low');

    add.OC_High += num(r.OC, 'High'); add.OC_Medium += num(r.OC, 'Medium'); add.OC_Low += num(r.OC, 'Low');

    add.pH_Alkaline += num(r.pH, 'Alkaline');
    add.pH_Acidic   += num(r.pH, 'Acidic');
    add.pH_Neutral  += num(r.pH, 'Neutral');

    add.EC_NonSaline += num(r.EC, 'NonSaline');
    add.EC_Saline    += num(r.EC, 'Saline');

    for (const [el, prefix] of [
      [r.S, 'S'], [r.Fe, 'Fe'], [r.Zn, 'Zn'], [r.Cu, 'Cu'], [r.B, 'B'], [r.Mn, 'Mn'],
    ] as const) {
      const suff = `${prefix}_Sufficient` as keyof SoilRow;
      const defi = `${prefix}_Deficient` as keyof SoilRow;
      (add[suff] as number) += num(el, 'Sufficient');
      (add[defi] as number) += num(el, 'Deficient');
    }

    byDistrict.set(key, add);
  }

  // A district with no samples at all would make the estimate meaningless.
  return [...byDistrict.values()].filter(
    (d) => d.n_high + d.n_medium + d.n_low > 0,
  );
}

/**
 * Mirrors Soil Health Card district nutrient data into `regional_soil_data`,
 * which `get_estimated_soil_health` reads whenever a farmer maps a field.
 *
 * New rows are written before stale ones are removed, so a failed fetch leaves
 * the previous data in place rather than emptying the table.
 */
export async function runSoilSync(cycle?: string): Promise<{
  states: number;
  districts: number;
  pruned: number;
}> {
  const startedAt = new Date().toISOString();

  const { data: run } = await db
    .from('ingestion_runs')
    .insert({ source: 'soil_health_card' })
    .select('id')
    .single();
  const runId = run?.id as string | undefined;

  try {
    const { getState } = await graphql<{ getState: StateRow[] }>(STATES_QUERY);
    const states = (getState ?? []).filter((s) => s?._id && s?.name);

    const all: SoilRow[] = [];
    let covered = 0;

    const cycles = cycle ? [cycle] : CYCLES;
    const without: string[] = [];
    const usedCycle: Record<string, number> = {};

    for (const state of states) {
      // Newest cycle wins per district, not per state: a state that has begun
      // reporting 2026-27 usually has only some of its districts in it, and
      // choosing per state would discard the rest.
      const byDistrict = new Map<string, SoilRow>();

      for (const attempt of cycles) {
        try {
          const res = await graphql<{ getNutrientDashboardForPortal: NutrientRow[] | null }>(
            NUTRIENTS_QUERY,
            { state: state._id, cycle: attempt },
          );
          for (const row of foldNutrientRows(state.name, res.getNutrientDashboardForPortal ?? [])) {
            const key = row.District.toLowerCase();
            if (!byDistrict.has(key)) {
              byDistrict.set(key, row);
              usedCycle[attempt] = (usedCycle[attempt] ?? 0) + 1;
            }
          }
        } catch (error) {
          // One state or cycle failing must not cost the rest.
          logger.warn('Soil sync: fetch failed', {
            state: state.name,
            cycle: attempt,
            error: (error as Error).message,
          });
        }
      }

      if (byDistrict.size > 0) covered += 1;
      else without.push(state.name);
      all.push(...byDistrict.values());
    }

    if (without.length > 0) {
      // Delhi, Ladakh and Dadra & Nagar Haveli report no Soil Health Card data
      // in any cycle — effectively non-agricultural, not a failed fetch.
      logger.info('Soil sync: no data in any cycle', { states: without });
    }

    if (all.length === 0) throw new Error('No districts returned — leaving existing data alone.');

    for (let i = 0; i < all.length; i += 200) {
      const chunk = all.slice(i, i + 200).map((row) => ({ ...row, synced_at: startedAt }));
      const { error } = await db
        .from('regional_soil_data')
        .upsert(chunk, { onConflict: 'State,District', ignoreDuplicates: false });
      if (error) throw new Error(`regional_soil_data: ${error.message}`);
    }

    // Only the hand-written 0004 seed is removed — rows with no `synced_at`.
    //
    // A district a previous sync wrote is deliberately left alone even when the
    // current cycle does not report it: while a cycle is still being collected
    // most districts are missing from it, and deleting them would empty the
    // table every April. The row keeps the newest figures we ever had.
    const { data: stale } = await db
      .from('regional_soil_data')
      .delete()
      .is('synced_at', null)
      .select('id');
    const pruned = stale?.length ?? 0;

    const counts = { states: covered, districts: all.length, pruned };

    if (runId) {
      await db
        .from('ingestion_runs')
        .update({
          status: 'ok',
          rows_written: all.length,
          detail: { ...counts, cycles, usedCycle },
          finished_at: new Date().toISOString(),
        })
        .eq('id', runId);
    }

    logger.info('Soil health data synced', { ...counts, usedCycle });
    return counts;
  } catch (error) {
    const message = (error as Error).message;
    if (runId) {
      await db
        .from('ingestion_runs')
        .update({ status: 'failed', error: message, finished_at: new Date().toISOString() })
        .eq('id', runId);
    }
    logger.error('Soil sync failed', { error: message });
    throw error;
  }
}
