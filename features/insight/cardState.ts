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
  /** Everything on record, however old. `fireCount` is only the active ones. */
  historyCount: number;
}

export interface FireWatchInput {
  hasField: boolean;
  isLoading: boolean;
  mapped: boolean | undefined;
  /** False when FIRMS could not be reached and this came from the store. */
  live: boolean;
  fires: { distanceKm: number; upwind: boolean | null }[];
  upwindCount: number;
  /**
   * Fires recent enough for today's wind to mean anything. The card speaks
   * about these; the full list behind it may stretch back months.
   */
  activeCount: number;
}

export function fireWatchState(input: FireWatchInput): FireWatchState {
  const empty = {
    tone: null, fireCount: 0, upwindCount: 0, nearestKm: null, stale: false, historyCount: 0,
  } as const;

  if (!input.hasField) return { kind: 'no-field', ...empty };
  if (input.isLoading) return { kind: 'loading', ...empty };
  if (input.mapped === false) return { kind: 'no-field', ...empty };

  const count = input.fires.length;

  // The case that matters: nothing came back AND nothing answered. An empty
  // list is only an all-clear when the service actually said so.
  if (count === 0 && !input.live) return { kind: 'unavailable', ...empty };

  const nearest = count > 0 ? Math.min(...input.fires.map((f) => f.distanceKm)) : null;

  // The tone describes what is burning *now*. A list of six months of fires
  // is history, not a warning, and colouring the card red for a fire that
  // went out in May would train a farmer to ignore it.
  return {
    kind: 'ready',
    tone: input.upwindCount > 0 ? 'upwind' : input.activeCount > 0 ? 'nearby' : 'clear',
    fireCount: input.activeCount,
    upwindCount: input.upwindCount,
    nearestKm: nearest,
    stale: !input.live,
    historyCount: count,
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


export interface MonitoringState {
  kind: CardKind;
  /** What the card says under the title. */
  caption: string;
  /** Whether the "live" dot has earned its colour. */
  fresh: boolean;
}

/** A date as a farmer reads it: "15 Oct", not an ISO string. */
function shortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * What the farm monitoring card should say.
 *
 * The map underneath is a Mapbox mosaic with no date on it — stitched years
 * ago in places, and identical from one week to the next. Labelling that
 * "live" was a claim the screen could not support. The caption now comes from
 * the Sentinel-2 catalogue, which does know when a satellite actually looked
 * and whether it saw anything through the cloud.
 */
export function monitoringState(input: {
  hasField: boolean;
  isLoading: boolean;
  available: boolean;
  mapped: boolean;
  lastClear: { date: string; cloudPercent: number } | null;
  latestPass: { date: string; cloudPercent: number } | null;
  nextExpected: string | null;
}): MonitoringState {
  if (!input.hasField) return { kind: 'no-field', caption: 'Map a field to begin', fresh: false };
  if (input.isLoading) return { kind: 'loading', caption: 'Checking the last pass', fresh: false };
  if (!input.mapped) return { kind: 'no-field', caption: 'Map a field to begin', fresh: false };

  // Reached nothing: say so rather than implying no satellite has been over.
  if (!input.available) {
    return { kind: 'unavailable', caption: 'Open farm map', fresh: false };
  }

  if (input.lastClear) {
    const days = Math.round(
      (Date.now() - new Date(`${input.lastClear.date}T00:00:00`).getTime()) / 86_400_000,
    );
    return {
      kind: 'ready',
      caption: `Clear view ${shortDate(input.lastClear.date)} · ${Math.round(input.lastClear.cloudPercent)}% cloud`,
      // Sentinel-2 revisits about every five days; older than two of those
      // and calling it current would be a stretch.
      fresh: days <= 10,
    };
  }

  // Passes happened, every one of them clouded out. That is worth saying —
  // it is why there is nothing new to look at.
  if (input.latestPass) {
    return {
      kind: 'no-data',
      caption: `Clouded out since ${shortDate(input.latestPass.date)}${
        input.nextExpected ? ` · next pass ${shortDate(input.nextExpected)}` : ''
      }`,
      fresh: false,
    };
  }

  return { kind: 'no-data', caption: 'No recent pass on record', fresh: false };
}


export interface VigourState {
  kind: CardKind;
  /** Mean NDVI, 0-1, when there is a reading. */
  ndvi: number | null;
  /** Plain words for what that number means for a canopy. */
  band: 'Bare' | 'Sparse' | 'Growing' | 'Dense' | null;
  /** Percentage change since the previous pass, rounded. */
  changePercent: number | null;
  /** A fall worth a farmer's attention rather than ordinary variation. */
  falling: boolean;
  measuredOn: string | null;
}

/**
 * How much living canopy the satellite saw.
 *
 * Bare soil reflects near-infrared and red almost equally, so NDVI sits near
 * 0.1-0.2; a closed healthy canopy reaches 0.6-0.9. The bands below follow
 * that, but the number alone says little — 0.4 is excellent for a seedling and
 * alarming for a crop about to be harvested. The change between two passes is
 * the part that carries a warning, which is why `falling` exists separately.
 */
export function vigourBand(v: number): VigourState['band'] {
  if (v >= 0.6) return 'Dense';
  if (v >= 0.4) return 'Growing';
  if (v >= 0.2) return 'Sparse';
  return 'Bare';
}

/** A drop this large between passes is not ordinary variation. */
export const VIGOUR_ALARM_DROP = 0.1;

export function vigourState(input: {
  hasField: boolean;
  isLoading: boolean;
  available: boolean;
  latest: { date: string; ndvi: number } | null;
  change: number | null;
}): VigourState {
  const empty = {
    ndvi: null, band: null, changePercent: null, falling: false, measuredOn: null,
  } as const;

  if (!input.hasField) return { kind: 'no-field', ...empty };
  if (input.isLoading) return { kind: 'loading', ...empty };
  if (!input.available) return { kind: 'unavailable', ...empty };

  // No reading yet is not the same as nothing growing: the job measures a
  // field after its next clear pass, which can be days away.
  if (!input.latest) return { kind: 'no-data', ...empty };

  return {
    kind: 'ready',
    ndvi: input.latest.ndvi,
    band: vigourBand(input.latest.ndvi),
    changePercent: input.change === null ? null : Math.round(input.change * 100),
    falling: input.change !== null && input.change <= -VIGOUR_ALARM_DROP,
    measuredOn: input.latest.date,
  };
}
