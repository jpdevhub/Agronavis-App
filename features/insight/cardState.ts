import { assessFungalRisk, type FungalAssessment } from './fungalRisk';
import type { ForecastDay } from '@agronavis/shared-types';

/**
 * What each insight card should be showing, as a decision separate from the
 * drawing of it.
 *
 * These cards sit on the dashboard of an app a farmer may act on without
 * reading closely, and their failure modes are not symmetric: showing "no
 * fires" because a request failed is far worse than showing nothing at all.
 * Pulling the decision out of the JSX is what makes every one of those cases
 * assertable — see `__tests__/cardState.test.ts`, which walks all of them.
 */

export type CardKind =
  | 'loading'       // still asking
  | 'no-field'      // nothing mapped yet, so there is nothing to ask about
  | 'unavailable'   // asked, got no answer — never dressed up as good news
  | 'no-data'       // answered, but the provider published nothing for this day
  | 'ready';        // a real answer

export interface RootZoneState {
  kind: CardKind;
  /** 0–100, only when `kind` is 'ready'. */
  pct: number | null;
  band: 'Wet' | 'Adequate' | 'Drying' | 'Dry' | null;
  /** Set when the measurement and the water balance tell different stories. */
  disagreement: 'wetter-than-balance' | 'drier-than-balance' | null;
  measuredOn: string | null;
}

export interface RootZoneInput {
  hasField: boolean;
  isLoading: boolean;
  /** Most recent POWER day carrying a root-zone reading, if any. */
  latest: { date: string; soilWetnessRoot: number | null } | null | undefined;
  waterDeficitMm: number | null;
}

export function bandFor(v: number): RootZoneState['band'] {
  if (v >= 0.6) return 'Wet';
  if (v >= 0.35) return 'Adequate';
  if (v >= 0.2) return 'Drying';
  return 'Dry';
}

const EMPTY_ROOT: Omit<RootZoneState, 'kind'> = {
  pct: null, band: null, disagreement: null, measuredOn: null,
};

export function rootZoneState(input: RootZoneInput): RootZoneState {
  // Order matters. "No field" outranks "loading" because a farmer with nothing
  // mapped should be told what to do, not watched spin.
  if (!input.hasField) return { kind: 'no-field', ...EMPTY_ROOT };
  if (input.isLoading) return { kind: 'loading', ...EMPTY_ROOT };

  const root = input.latest?.soilWetnessRoot;
  if (root == null || !Number.isFinite(root)) {
    return { kind: 'no-data', ...EMPTY_ROOT };
  }

  // POWER does not publish a reading every day; a missing one is 'no-data'
  // above, not a zero. A real zero would be a genuinely bone-dry field.
  const deficit = input.waterDeficitMm;
  let disagreement: RootZoneState['disagreement'] = null;
  if (deficit !== null) {
    if (root >= 0.5 && deficit > 20) disagreement = 'wetter-than-balance';
    else if (root < 0.2 && deficit <= 0) disagreement = 'drier-than-balance';
  }

  return {
    kind: 'ready',
    pct: Math.round(root * 100),
    band: bandFor(root),
    disagreement,
    measuredOn: input.latest?.date ?? null,
  };
}

export interface FireWatchState {
  kind: CardKind;
  tone: 'upwind' | 'nearby' | 'clear' | null;
  fireCount: number;
  upwindCount: number;
  nearestKm: number | null;
  /** True when the list came from the store because FIRMS did not answer. */
  stale: boolean;
}

export interface FireWatchInput {
  hasField: boolean;
  isLoading: boolean;
  mapped: boolean | undefined;
  /** False when FIRMS could not be reached and this came from the store. */
  live: boolean;
  fires: { distanceKm: number; upwind: boolean | null }[];
  upwindCount: number;
}

export function fireWatchState(input: FireWatchInput): FireWatchState {
  const empty = { tone: null, fireCount: 0, upwindCount: 0, nearestKm: null, stale: false } as const;

  if (!input.hasField) return { kind: 'no-field', ...empty };
  if (input.isLoading) return { kind: 'loading', ...empty };
  if (input.mapped === false) return { kind: 'no-field', ...empty };

  const count = input.fires.length;

  // The case that matters: nothing came back AND nothing answered. An empty
  // list is only an all-clear when the service actually said so.
  if (count === 0 && !input.live) return { kind: 'unavailable', ...empty };

  const nearest = count > 0 ? Math.min(...input.fires.map((f) => f.distanceKm)) : null;

  return {
    kind: 'ready',
    tone: input.upwindCount > 0 ? 'upwind' : count > 0 ? 'nearby' : 'clear',
    fireCount: count,
    upwindCount: input.upwindCount,
    nearestKm: nearest,
    stale: !input.live,
  };
}

export interface DiseaseState {
  kind: CardKind;
  level: FungalAssessment['level'];
  riskyDayCount: number;
  assessment: FungalAssessment;
}

/**
 * Fungal risk is only ever as good as the forecast behind it. With no
 * forecast the honest answer is "not checked", never "no infection" — a
 * farmer told their crop is clear will not scout for lesions.
 */
export function diseaseState(input: {
  hasField: boolean;
  isLoading: boolean;
  forecast: ForecastDay[];
}): DiseaseState {
  const assessment = assessFungalRisk(input.forecast);
  const base = { level: assessment.level, riskyDayCount: assessment.riskyDays.length, assessment };

  if (!input.hasField) return { kind: 'no-field', ...base };
  if (input.isLoading) return { kind: 'loading', ...base };
  if (input.forecast.length === 0) return { kind: 'no-data', ...base };
  return { kind: 'ready', ...base };
}
