import axios from 'axios';
import type {
  DashboardPrice,
  MandiPrice,
  PriceDirection,
  PriceTrend,
} from '@agronavis/shared-types';
import { env } from '../../config/env';
import { logger } from '../../config/logger';
import { db } from '../../config/supabase';
import { TtlCache } from '../../shared/cache';

/**
 * Agmarknet daily wholesale prices, via the data.gov.in open data platform.
 * Free, but the upstream is slow and often sparse, so every response is cached
 * in-process for an hour and mirrored into `market_prices` for offline reads.
 */
const AGMARKNET_RESOURCE = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

const priceCache = new TtlCache<MandiPrice[]>(60 * 60_000);

/** Agmarknet spells commodities its own way; try each until one matches. */
const COMMODITY_SYNONYMS: Record<string, string[]> = {
  wheat: ['Wheat'],
  rice: ['Rice', 'Paddy(Dhan)(Common)', 'Paddy(Dhan)(Basmati)'],
  paddy: ['Paddy(Dhan)(Common)', 'Rice'],
  maize: ['Maize'],
  soybean: ['Soyabean', 'Soybean'],
  cotton: ['Cotton', 'Kapas'],
  tomato: ['Tomato'],
  onion: ['Onion'],
  potato: ['Potato'],
  sugarcane: ['Sugarcane'],
  groundnut: ['Groundnut', 'Groundnut (Split)'],
  mustard: ['Mustard', 'Rape Seed'],
  bajra: ['Bajra(Pearl Millet/Cumbu)'],
  jowar: ['Jowar(Sorghum)'],
  gram: ['Bengal Gram(Gram)(Whole)'],
  turmeric: ['Turmeric'],
  chilli: ['Chilly Capsicum', 'Dry Chillies'],
  banana: ['Banana'],
  mango: ['Mango'],
};

const STATE_ALIASES: Record<string, string> = {
  up: 'Uttar Pradesh',
  mp: 'Madhya Pradesh',
  wb: 'West Bengal',
  ap: 'Andhra Pradesh',
  tn: 'Tamil Nadu',
  hp: 'Himachal Pradesh',
  jk: 'Jammu and Kashmir',
  odisha: 'Orissa', // Agmarknet still publishes the pre-2011 name
  uttarakhand: 'Uttrakhand',
};

function normaliseState(state: string): string {
  const key = state.trim().toLowerCase();
  return STATE_ALIASES[key] ?? state.trim();
}

function synonymsFor(commodity: string): string[] {
  const key = commodity.trim().toLowerCase();
  return COMMODITY_SYNONYMS[key] ?? [commodity.trim()];
}

/**
 * data.gov.in has renamed these fields at least twice ("Min_x0020_Price" →
 * "min_price"). Reading whichever form is present keeps the integration alive
 * across their changes instead of silently returning zeroes.
 */
function pick(record: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && String(value).length > 0) return String(value);
  }
  return '';
}

function toMandiPrice(record: Record<string, unknown>, fallbackCommodity: string): MandiPrice | null {
  const modal = Number(pick(record, 'Modal_x0020_Price', 'modal_price', 'Modal Price'));
  if (!Number.isFinite(modal) || modal <= 0) return null;

  const rawDate = pick(record, 'Arrival_Date', 'arrival_date');
  // Agmarknet emits DD/MM/YYYY.
  const [dd, mm, yyyy] = rawDate.split('/');
  const arrivalDate =
    yyyy && mm && dd ? `${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}` : rawDate;

  return {
    commodity: pick(record, 'Commodity', 'commodity') || fallbackCommodity,
    variety: pick(record, 'Variety', 'variety') || 'Common',
    state: pick(record, 'State', 'state'),
    district: pick(record, 'District', 'district'),
    market: pick(record, 'Market', 'market'),
    minPrice: Number(pick(record, 'Min_x0020_Price', 'min_price')) || 0,
    maxPrice: Number(pick(record, 'Max_x0020_Price', 'max_price')) || 0,
    modalPrice: modal,
    unit: 'Quintal',
    arrivalDate: arrivalDate || new Date().toISOString().slice(0, 10),
  };
}

async function queryAgmarknet(filters: Record<string, string>, limit: number): Promise<Record<string, unknown>[]> {
  if (!env.AGMARKNET_API_KEY) {
    logger.warn('AGMARKNET_API_KEY is not set — returning no mandi prices');
    return [];
  }
  const params: Record<string, string | number> = {
    'api-key': env.AGMARKNET_API_KEY,
    format: 'json',
    limit,
  };
  for (const [field, value] of Object.entries(filters)) {
    params[`filters[${field}]`] = value;
  }

  const { data } = await axios.get(AGMARKNET_RESOURCE, { params, timeout: 15_000 });
  return (data?.records ?? []) as Record<string, unknown>[];
}

async function getLivePrices(commodity: string, state: string, limit = 30): Promise<MandiPrice[]> {
  const normState = normaliseState(state);
  return priceCache.wrap(`${commodity}:${normState}:${limit}`, async () => {
    for (const name of synonymsFor(commodity)) {
      try {
        const records = await queryAgmarknet({ State: normState, Commodity: name }, limit);
        const prices = records
          .map((r) => toMandiPrice(r, commodity))
          .filter((p): p is MandiPrice => p !== null);
        if (prices.length > 0) return prices;
      } catch (error) {
        logger.warn('Agmarknet query failed', {
          commodity: name,
          state: normState,
          error: (error as Error).message,
        });
      }
    }

    // Nothing in this state today — fall back to the national picture so the
    // widget shows a real number rather than an empty card.
    try {
      const records = await queryAgmarknet({ Commodity: synonymsFor(commodity)[0]! }, 10);
      return records.map((r) => toMandiPrice(r, commodity)).filter((p): p is MandiPrice => p !== null);
    } catch {
      return [];
    }
  });
}

async function getPriceTrend(commodity: string, state: string): Promise<PriceTrend | null> {
  const prices = await getLivePrices(commodity, state, 100);
  if (prices.length === 0) return null;

  // Median modal price per arrival date, so one outlier mandi cannot move the trend.
  const byDate = new Map<string, number[]>();
  for (const p of prices) {
    const bucket = byDate.get(p.arrivalDate);
    if (bucket) bucket.push(p.modalPrice);
    else byDate.set(p.arrivalDate, [p.modalPrice]);
  }

  const history = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, values]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
      return { date, price: Math.round(median) };
    });

  const current = history.at(-1)?.price ?? 0;
  const previous = history.at(-2)?.price ?? current;
  const change = current - previous;
  const changePct = previous ? Math.round((change / previous) * 1000) / 10 : 0;
  const direction: PriceDirection =
    Math.abs(changePct) < 1 ? 'stable' : change > 0 ? 'up' : 'down';

  return { commodity, currentPrice: current, previousPrice: previous, change, changePct, direction, history };
}

async function getDashboardPrices(state: string, crops: string[]): Promise<DashboardPrice[]> {
  const settled = await Promise.allSettled(crops.map((crop) => getPriceTrend(crop, state)));

  return settled.flatMap((result, index) => {
    if (result.status !== 'fulfilled' || !result.value) return [];
    const trend = result.value;
    return [
      {
        commodity: crops[index]!,
        price: trend.currentPrice,
        unit: '₹/quintal',
        market: `${normaliseState(state)} mandi`,
        trend: trend.direction,
        changePct: trend.changePct,
        arrivalDate: trend.history.at(-1)?.date ?? new Date().toISOString().slice(0, 10),
      },
    ];
  });
}

/** Mirrors a fetched trend into `market_prices` for offline and history reads. */
async function persist(state: string, trend: PriceTrend, sample: MandiPrice | undefined): Promise<void> {
  const arrivalDate = trend.history.at(-1)?.date;
  if (!arrivalDate) return;

  const { error } = await db.from('market_prices').upsert(
    {
      commodity: trend.commodity,
      state: normaliseState(state),
      district: sample?.district ?? '',
      market: sample?.market ?? '',
      variety: sample?.variety ?? 'Common',
      min_price: sample?.minPrice ?? trend.currentPrice,
      max_price: sample?.maxPrice ?? trend.currentPrice,
      modal_price: trend.currentPrice,
      direction: trend.direction,
      change_pct: trend.changePct,
      arrival_date: arrivalDate,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: 'commodity,state,market,arrival_date' },
  );
  if (error) logger.warn('Market price not cached', { error: error.message });
}

export const marketService = {
  getLivePrices,
  getPriceTrend,
  getDashboardPrices,
  persist,
  normaliseState,
};
