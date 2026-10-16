import {
  FUNGAL_ALERT_DAYS,
  FUNGAL_MAX_C,
  FUNGAL_MIN_C,
  LEAF_WETNESS_MARGIN_C,
  assessFungalRisk,
  dewPoint,
} from '../fungalRisk';

/**
 * These numbers are the server's. If the backend changes a threshold without
 * changing it here, the screen would disagree with the alert the farmer was
 * sent — so the constants are asserted, not just the behaviour.
 */
describe('agreement with the server', () => {
  it('holds the same thresholds advisory.service.ts uses', () => {
    expect(LEAF_WETNESS_MARGIN_C).toBe(2);
    expect(FUNGAL_MIN_C).toBe(18);
    expect(FUNGAL_MAX_C).toBe(32);
    expect(FUNGAL_ALERT_DAYS).toBe(2);
  });

  it('computes the same dew point as et0.ts', () => {
    // Magnus-Tetens, Alduchov-Eskridge. 25 °C at 60% RH is ~16.7 °C.
    expect(dewPoint(25, 60)).toBeCloseTo(16.7, 1);
    expect(dewPoint(30, 90)).toBeCloseTo(28.2, 1);
    // Saturated air has its dew point at the air temperature.
    expect(dewPoint(20, 100)).toBeCloseTo(20, 1);
  });

  it('clamps absurd humidity rather than returning -Infinity', () => {
    expect(Number.isFinite(dewPoint(25, 0))).toBe(true);
    expect(dewPoint(25, 0)).toBe(dewPoint(25, 1));
  });
});

const day = (over: Partial<Record<string, number | string>> = {}) => ({
  date: '2026-10-16',
  tempMin: 20,
  tempMax: 29,
  humidity: 90,
  rainMm: 0,
  windSpeed: 2,
  windFromDeg: 180,
  description: 'clear',
  icon: '01d',
  ...over,
}) as never;

describe('assessFungalRisk', () => {
  it('calls a warm humid night risky', () => {
    const { level, riskyDays } = assessFungalRisk([day(), day({ date: '2026-10-17' })]);
    expect(riskyDays).toHaveLength(2);
    expect(level).toBe('high');
  });

  it('is clear when the night stays well above the dew point', () => {
    const dry = day({ humidity: 30, tempMin: 22 });
    expect(assessFungalRisk([dry, dry]).level).toBe('clear');
  });

  it('does not flag a wet night that is too cold for the fungus', () => {
    // Leaves wet, but below the 18 °C the spores need.
    const cold = day({ tempMin: 10, tempMax: 18, humidity: 95 });
    const result = assessFungalRisk([cold, cold]);
    expect(result.days[0]!.leafWet).toBe(true);
    expect(result.riskyDays).toHaveLength(0);
    expect(result.level).toBe('clear');
  });

  it('calls a single risky night a watch, not an alert', () => {
    const { level } = assessFungalRisk([day(), day({ date: '2026-10-17', humidity: 30 })]);
    expect(level).toBe('watch');
  });

  it('handles an empty forecast', () => {
    expect(assessFungalRisk([])).toEqual({ days: [], riskyDays: [], level: 'clear' });
  });
});
