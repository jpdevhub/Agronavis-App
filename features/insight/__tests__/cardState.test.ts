import {
  bandFor,
  diseaseState,
  fireWatchState,
  rootZoneState,
  type FireWatchInput,
  type RootZoneInput,
} from '../cardState';

/**
 * Every state each insight card can be in, asserted.
 *
 * The rule these all serve: a card may say "I do not know", but it may never
 * say "everything is fine" unless something actually checked. Both cards
 * shipped a version that broke that rule — the fire card printed "nothing
 * burning nearby" when FIRMS had not answered, and the root zone card
 * vanished entirely rather than admit it had no reading.
 */

const rootInput = (over: Partial<RootZoneInput> = {}): RootZoneInput => ({
  hasField: true,
  isLoading: false,
  latest: { date: '2026-10-14', soilWetnessRoot: 0.73 },
  waterDeficitMm: 0,
  ...over,
});

describe('root zone card', () => {
  it('asks for a field before anything else', () => {
    // Even mid-load: there is nothing to load for a farmer with no land mapped.
    expect(rootZoneState(rootInput({ hasField: false, isLoading: true })).kind).toBe('no-field');
  });

  it('shows a loader while the reading is on its way', () => {
    expect(rootZoneState(rootInput({ isLoading: true })).kind).toBe('loading');
  });

  it.each([
    ['null reading', null],
    ['undefined day', undefined],
  ])('says no-data rather than zero for %s', (_label, latest) => {
    const state = rootZoneState(rootInput({ latest: latest as never }));
    expect(state.kind).toBe('no-data');
    expect(state.pct).toBeNull();
  });

  it('says no-data when POWER published the day but not the value', () => {
    const state = rootZoneState(rootInput({ latest: { date: '2026-10-14', soilWetnessRoot: null } }));
    expect(state.kind).toBe('no-data');
  });

  it('treats a genuine zero as a reading, not as missing', () => {
    const state = rootZoneState(rootInput({ latest: { date: '2026-10-14', soilWetnessRoot: 0 } }));
    expect(state.kind).toBe('ready');
    expect(state.pct).toBe(0);
    expect(state.band).toBe('Dry');
  });

  it.each([
    [1, 'Wet'],
    [0.73, 'Wet'],
    [0.6, 'Wet'],
    [0.599, 'Adequate'],
    [0.35, 'Adequate'],
    [0.349, 'Drying'],
    [0.2, 'Drying'],
    [0.199, 'Dry'],
    [0, 'Dry'],
  ])('reads %s as %s, including at the boundary', (value, expected) => {
    expect(bandFor(value as number)).toBe(expected);
  });

  it('rounds the percentage for display', () => {
    expect(rootZoneState(rootInput({ latest: { date: 'd', soilWetnessRoot: 0.7349 } })).pct).toBe(73);
  });

  it('flags soil wetter than the balance expects', () => {
    const state = rootZoneState(rootInput({
      latest: { date: 'd', soilWetnessRoot: 0.7 },
      waterDeficitMm: 40,
    }));
    expect(state.disagreement).toBe('wetter-than-balance');
  });

  it('flags soil drier than the balance expects', () => {
    const state = rootZoneState(rootInput({
      latest: { date: 'd', soilWetnessRoot: 0.1 },
      waterDeficitMm: 0,
    }));
    expect(state.disagreement).toBe('drier-than-balance');
  });

  it('reports no disagreement when the two agree', () => {
    expect(rootZoneState(rootInput({
      latest: { date: 'd', soilWetnessRoot: 0.45 },
      waterDeficitMm: 10,
    })).disagreement).toBeNull();
  });

  it('claims no disagreement when there is no balance to compare against', () => {
    expect(rootZoneState(rootInput({ waterDeficitMm: null })).disagreement).toBeNull();
  });

  it('carries the measurement date, because POWER runs days behind', () => {
    expect(rootZoneState(rootInput()).measuredOn).toBe('2026-10-14');
  });
});

const fireInput = (over: Partial<FireWatchInput> = {}): FireWatchInput => ({
  hasField: true,
  isLoading: false,
  mapped: true,
  live: true,
  fires: [],
  upwindCount: 0,
  ...over,
});

describe('fire watch card', () => {
  it('asks for a field first', () => {
    expect(fireWatchState(fireInput({ hasField: false })).kind).toBe('no-field');
  });

  it('shows a loader while asking', () => {
    expect(fireWatchState(fireInput({ isLoading: true })).kind).toBe('loading');
  });

  it('asks for a boundary when the farm has no mapped field', () => {
    expect(fireWatchState(fireInput({ mapped: false })).kind).toBe('no-field');
  });

  // ── The bug this whole module exists for ──────────────────────────────
  it('never calls an unanswered request an all-clear', () => {
    const state = fireWatchState(fireInput({ live: false, fires: [] }));
    expect(state.kind).toBe('unavailable');
    expect(state.tone).not.toBe('clear');
  });

  it('does call a real empty answer an all-clear', () => {
    const state = fireWatchState(fireInput({ live: true, fires: [] }));
    expect(state.kind).toBe('ready');
    expect(state.tone).toBe('clear');
    expect(state.fireCount).toBe(0);
  });

  it('reports fires that are near but not upwind', () => {
    const state = fireWatchState(fireInput({
      fires: [{ distanceKm: 18, upwind: false }, { distanceKm: 42, upwind: false }],
      upwindCount: 0,
    }));
    expect(state.tone).toBe('nearby');
    expect(state.fireCount).toBe(2);
    expect(state.nearestKm).toBe(18);
  });

  it('escalates when any fire is upwind', () => {
    const state = fireWatchState(fireInput({
      fires: [{ distanceKm: 55, upwind: true }, { distanceKm: 12, upwind: false }],
      upwindCount: 1,
    }));
    expect(state.tone).toBe('upwind');
    expect(state.upwindCount).toBe(1);
    // The nearest fire is still the nearest, upwind or not.
    expect(state.nearestKm).toBe(12);
  });

  it('shows stored fires and marks them stale rather than hiding them', () => {
    const state = fireWatchState(fireInput({
      live: false,
      fires: [{ distanceKm: 30, upwind: false }],
    }));
    expect(state.kind).toBe('ready');
    expect(state.stale).toBe(true);
    expect(state.fireCount).toBe(1);
  });

  it('is not stale when the answer was live', () => {
    expect(fireWatchState(fireInput({ fires: [{ distanceKm: 9, upwind: null }] })).stale).toBe(false);
  });

  it('finds the nearest regardless of the order they arrive in', () => {
    const state = fireWatchState(fireInput({
      fires: [{ distanceKm: 90, upwind: null }, { distanceKm: 4, upwind: null }, { distanceKm: 51, upwind: null }],
    }));
    expect(state.nearestKm).toBe(4);
  });
});

const forecastDay = (over: Record<string, unknown> = {}) => ({
  date: '2026-10-16',
  tempMin: 20, tempMax: 29, humidity: 90,
  rainMm: 0, windSpeed: 2, windFromDeg: 180,
  description: 'clear', icon: '01d',
  ...over,
}) as never;

describe('disease watch', () => {
  it('asks for a field first', () => {
    expect(diseaseState({ hasField: false, isLoading: false, forecast: [] }).kind).toBe('no-field');
  });

  it('shows a loader while the forecast is on its way', () => {
    expect(diseaseState({ hasField: true, isLoading: true, forecast: [] }).kind).toBe('loading');
  });

  // ── The disease equivalent of the all-clear bug ───────────────────────
  it('says not-checked rather than clear when there is no forecast', () => {
    const state = diseaseState({ hasField: true, isLoading: false, forecast: [] });
    expect(state.kind).toBe('no-data');
    expect(state.riskyDayCount).toBe(0);
  });

  it('reports clear when the nights are genuinely dry', () => {
    const dry = forecastDay({ humidity: 30, tempMin: 22 });
    const state = diseaseState({ hasField: true, isLoading: false, forecast: [dry, dry] });
    expect(state.kind).toBe('ready');
    expect(state.level).toBe('clear');
  });

  it('reports a watch for a single risky night', () => {
    const state = diseaseState({
      hasField: true, isLoading: false,
      forecast: [forecastDay(), forecastDay({ date: '2026-10-17', humidity: 25 })],
    });
    expect(state.level).toBe('watch');
    expect(state.riskyDayCount).toBe(1);
  });

  it('reports high once two nights qualify, matching the server alert', () => {
    const state = diseaseState({
      hasField: true, isLoading: false,
      forecast: [forecastDay(), forecastDay({ date: '2026-10-17' })],
    });
    expect(state.level).toBe('high');
    expect(state.riskyDayCount).toBe(2);
  });

  it('does not raise risk for wet nights too cold for the fungus', () => {
    const cold = forecastDay({ tempMin: 10, tempMax: 17, humidity: 97 });
    const state = diseaseState({ hasField: true, isLoading: false, forecast: [cold, cold] });
    expect(state.assessment.days[0]!.leafWet).toBe(true);
    expect(state.level).toBe('clear');
  });

  it('does not raise risk for wet nights too hot for the fungus', () => {
    const hot = forecastDay({ tempMin: 28, tempMax: 40, humidity: 95 });
    const state = diseaseState({ hasField: true, isLoading: false, forecast: [hot, hot] });
    expect(state.level).toBe('clear');
  });
});
