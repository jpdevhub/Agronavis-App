import { describeArea, acresToSqm } from '../area';

/**
 * Smallholdings are the normal case in India, and acres describe them badly.
 * A farmer mapping one katha who reads "~0.02 acres" concludes the app is
 * broken, and they are not far wrong about its usefulness.
 */
describe('describeArea', () => {
  it('converts acres to square metres correctly', () => {
    expect(acresToSqm(1)).toBeCloseTo(4046.86, 1);
  });

  it('leads with katha for a small Bengal plot', () => {
    // One katha is 720 sq ft = 66.89 m² = 0.0165 acres.
    const out = describeArea(0.0165, 'West Bengal');
    expect(out).toMatch(/katha/);
    expect(out).toMatch(/^~1 katha/);
  });

  it('never shows a small plot as a meaningless fraction of an acre', () => {
    expect(describeArea(0.0165, 'West Bengal')).not.toMatch(/acre/);
    expect(describeArea(0.0165, 'Punjab')).not.toMatch(/acre/);
  });

  it('falls back to square metres where the local unit is not settled', () => {
    const out = describeArea(0.0165, 'Punjab');
    expect(out).toMatch(/m²/);
    expect(out).toMatch(/^~67 m²/);
  });

  it('uses guntha in the Deccan states', () => {
    // One guntha is 1089 sq ft, 40 to the acre.
    expect(describeArea(0.025, 'Maharashtra')).toMatch(/guntha/);
  });

  it('leads with acres for a larger field, local unit alongside', () => {
    const out = describeArea(2, 'West Bengal');
    expect(out).toMatch(/^~2 acres/);
    expect(out).toMatch(/katha/);
  });

  it('is case and whitespace insensitive about the state', () => {
    expect(describeArea(0.0165, '  west bengal ')).toMatch(/katha/);
  });

  it('handles an unknown state', () => {
    expect(describeArea(1, null)).toBe('~1 acre');
    expect(describeArea(2.5, undefined)).toBe('~2.5 acres');
  });

  it('refuses to describe an impossible area', () => {
    expect(describeArea(0)).toBe('—');
    expect(describeArea(-1)).toBe('—');
    expect(describeArea(Number.NaN)).toBe('—');
  });

  it('rounds large areas to whole numbers', () => {
    expect(describeArea(1234)).toBe('~1234 acres');
  });
});
