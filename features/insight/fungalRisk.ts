import type { ForecastDay } from '@agronavis/shared-types';

/**
 * Whether the coming nights will leave the crop wet long enough for a fungal
 * spore to germinate.
 *
 * ── Kept in step with the server ──────────────────────────────────────────
 * These constants and the dew-point formula mirror
 * `backend/src/modules/advisory/advisory.service.ts` and
 * `backend/src/modules/weather/et0.ts`, which decide whether to raise the
 * alert. The copy exists because the shared package carries types only — it is
 * erased from the app bundle — and adding runtime code to it would change how
 * Metro treats a dependency every screen imports. `__tests__/fungalRisk.test.ts`
 * pins both sides to the same numbers, so a change on the server that is not
 * mirrored here fails the suite rather than quietly putting a different answer
 * on the screen than in the alert.
 */
const MAGNUS_A = 17.625;
const MAGNUS_B = 243.04;

/** How close the night must come to the dew point before leaves count as wet. */
export const LEAF_WETNESS_MARGIN_C = 2;

/** The band blast and blight actually sporulate in. */
export const FUNGAL_MIN_C = 18;
export const FUNGAL_MAX_C = 32;

/** At least this many risky days before the server raises an advisory. */
export const FUNGAL_ALERT_DAYS = 2;

/**
 * Dew point in °C — Magnus-Tetens with the Alduchov-Eskridge coefficients,
 * good to about 0.1 °C across every temperature a crop grows in.
 */
export function dewPoint(temperatureC: number, relativeHumidity: number): number {
  const rh = Math.min(100, Math.max(1, relativeHumidity));
  const gamma = Math.log(rh / 100) + (MAGNUS_A * temperatureC) / (MAGNUS_B + temperatureC);
  return (MAGNUS_B * gamma) / (MAGNUS_A - gamma);
}

export interface DayRisk {
  date: string;
  /** Will dew form on the leaves tonight? */
  leafWet: boolean;
  /** Is the day mild enough for the fungus as well as wet enough? */
  risky: boolean;
  /** Degrees between the night's low and the dew point. Below ~2, dew forms. */
  marginC: number;
  dewPointC: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
}

export function assessDay(day: ForecastDay): DayRisk {
  const meanTemp = (day.tempMin + day.tempMax) / 2;
  const dp = dewPoint(meanTemp, day.humidity);
  const marginC = day.tempMin - dp;
  const leafWet = marginC <= LEAF_WETNESS_MARGIN_C;

  return {
    date: day.date,
    leafWet,
    risky: leafWet && day.tempMin >= FUNGAL_MIN_C && day.tempMax <= FUNGAL_MAX_C,
    marginC,
    dewPointC: dp,
    tempMin: day.tempMin,
    tempMax: day.tempMax,
    humidity: day.humidity,
  };
}

export type RiskLevel = 'clear' | 'watch' | 'high';

export interface FungalAssessment {
  days: DayRisk[];
  riskyDays: DayRisk[];
  level: RiskLevel;
}

/**
 * Reads the forecast as one verdict.
 *
 * `high` is the threshold the server alerts on. `watch` is a single risky
 * night — not worth a notification, but worth saying on a page the farmer
 * opened on purpose, because it is the day before `high`.
 */
export function assessFungalRisk(forecast: ForecastDay[]): FungalAssessment {
  const days = forecast.map(assessDay);
  const riskyDays = days.filter((d) => d.risky);

  const level: RiskLevel =
    riskyDays.length >= FUNGAL_ALERT_DAYS ? 'high' : riskyDays.length > 0 ? 'watch' : 'clear';

  return { days, riskyDays, level };
}
