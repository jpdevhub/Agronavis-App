import type { MandiPrice } from '@agronavis/shared-types';

/**
 * Mirrors the boundary guard in useMandiSearch. The hook itself needs a
 * react-query harness; this pins the behaviour that actually broke the screen.
 */
function normalise(row: MandiPrice): MandiPrice {
  const markets = Array.isArray(row.markets) ? row.markets.filter(Boolean) : [];
  return {
    ...row,
    markets,
    marketsReporting:
      typeof row.marketsReporting === 'number' && row.marketsReporting > 0
        ? row.marketsReporting
        : markets.length || (row.market ? 1 : 0),
  };
}

/** What a backend released before these fields existed sends. */
const legacy = {
  commodity: 'Brinjal',
  variety: 'Common',
  state: 'West Bengal',
  district: 'Nadia',
  market: 'Kalyani',
  minPrice: 3000,
  maxPrice: 4000,
  modalPrice: 3500,
  unit: 'Quintal',
  arrivalDate: '2026-09-23',
} as unknown as MandiPrice;

describe('mandi row normalisation', () => {
  it('survives a response with no markets field', () => {
    const r = normalise(legacy);
    expect(r.markets).toEqual([]);
    expect(() => r.markets.length).not.toThrow();
  });

  it('counts the one mandi an older row names', () => {
    expect(normalise(legacy).marketsReporting).toBe(1);
  });

  it('reports nothing when the old row names no mandi either', () => {
    const r = normalise({ ...legacy, market: '' } as MandiPrice);
    expect(r.marketsReporting).toBe(0);
    expect(r.markets).toEqual([]);
  });

  it('leaves a current row alone', () => {
    const current = { ...legacy, markets: ['Habra', 'Indus'], marketsReporting: 2 } as MandiPrice;
    const r = normalise(current);
    expect(r.markets).toEqual(['Habra', 'Indus']);
    expect(r.marketsReporting).toBe(2);
  });

  it('drops blanks the feed leaves in the list', () => {
    const r = normalise({ ...legacy, markets: ['Habra', '', 'Indus'] } as MandiPrice);
    expect(r.markets).toEqual(['Habra', 'Indus']);
    expect(r.marketsReporting).toBe(2);
  });
});
