import { sortSuggestions } from '../sorting';
import { rupees } from '../formatting';
import type { CropSuggestion } from '@agronavis/shared-types';

/**
 * The order the farmer sees.
 *
 * Sorting must never become a second way of hiding things. Whichever column
 * is chosen, a crop that cannot be sown this month stays below one that can —
 * putting the state's most profitable crop at the top in a month nobody can
 * plant it is the mistake this screen exists to prevent.
 */

const crop = (over: Partial<CropSuggestion>): CropSuggestion => ({
  crop: 'test', category: 'cereal', season: 'kharif', durationDays: 100,
  sowingWindows: ['June to July'], sowableNow: true, fit: 50,
  pricePerQuintal: 2000, expectedYieldQuintals: 20,
  estimatedRevenue: 40000, estimatedInputCost: 20000, estimatedProfit: 20000,
  cautions: [], fertiliser: { needed: { n: 0, p: 0, k: 0 }, products: [], workings: [] },
  notes: null, ...over,
});

describe('ordering the list', () => {
  it('puts the most profitable first', () => {
    const list = [crop({ crop: 'a', estimatedProfit: 10000 }), crop({ crop: 'b', estimatedProfit: 90000 })];
    expect(sortSuggestions(list, 'profit').map((c) => c.crop)).toEqual(['b', 'a']);
  });

  it('keeps an out-of-season crop below a sowable one however it is sorted', () => {
    const rich = crop({ crop: 'mango', sowableNow: false, estimatedProfit: 500000 });
    const modest = crop({ crop: 'mustard', sowableNow: true, estimatedProfit: 20000 });
    for (const key of ['profit', 'cost', 'water', 'season'] as const) {
      expect(sortSuggestions([rich, modest], key)[0].crop).toBe('mustard');
    }
  });

  it('never drops a crop, whichever sort is chosen', () => {
    const list = [crop({ crop: 'a' }), crop({ crop: 'b', estimatedProfit: null }), crop({ crop: 'c' })];
    for (const key of ['profit', 'cost', 'water', 'season'] as const) {
      expect(sortSuggestions(list, key)).toHaveLength(3);
    }
  });

  it('puts an unpriced crop last on profit rather than first', () => {
    // A plain null-as-zero sort would float it above a crop that loses money.
    const list = [crop({ crop: 'priced', estimatedProfit: 5000 }), crop({ crop: 'unpriced', estimatedProfit: null })];
    expect(sortSuggestions(list, 'profit').map((c) => c.crop)).toEqual(['priced', 'unpriced']);
  });

  it('sorts by cost and by water from the crop\'s own notes', () => {
    const cheap = crop({ crop: 'cheap', estimatedInputCost: 9000 });
    const dear = crop({ crop: 'dear', estimatedInputCost: 80000 });
    expect(sortSuggestions([dear, cheap], 'cost')[0].crop).toBe('cheap');

    const thirsty = crop({ crop: 'thirsty', cautions: ['about 400 mm short of rain — it would need watering'] });
    const content = crop({ crop: 'content', cautions: [] });
    expect(sortSuggestions([thirsty, content], 'water')[0].crop).toBe('content');
  });
});

describe('money on a phone screen', () => {
  it('reads a lakh as a lakh', () => {
    expect(rupees(210000)).toBe('₹2.1 L');
    expect(rupees(100000)).toBe('₹1 L');
  });

  it('rounds thousands and keeps small figures exact', () => {
    expect(rupees(40000)).toBe('₹40k');
    expect(rupees(640)).toBe('₹640');
  });

  it('does not lose the sign on a loss', () => {
    expect(rupees(-24000)).toContain('-');
  });
});

import { mergeRanking, orderMerged, rankedCount } from '../merge';
import type { EligibleCrop } from '@agronavis/shared-types';

/**
 * Joining the scheme's crop list to the ranking.
 *
 * Two sources that do not line up: the scheme lists what a state may grow and
 * carries the id needed to add one; the ranking knows 43 crops in depth. The
 * join must never lose a crop — the scheme saying it grows here is itself
 * information the farmer is entitled to.
 */

const eligible = (name: string, shcId = name): EligibleCrop => ({
  shcId, name, variety: null, label: `${name} (All Variety)`,
});

describe('joining the catalogue to the ranking', () => {
  it('keeps every crop the scheme lists, rated or not', () => {
    const list = [eligible('rice'), eligible('arecanut'), eligible('wheat')];
    const merged = mergeRanking(list, [crop({ crop: 'rice' }), crop({ crop: 'wheat' })]);

    expect(merged).toHaveLength(3);
    expect(rankedCount(merged)).toBe(2);
    expect(merged.find((m) => m.eligible.name === 'arecanut')?.ranking).toBeNull();
  });

  it('puts rated crops above unrated ones', () => {
    const merged = mergeRanking(
      [eligible('arecanut'), eligible('rice')],
      [crop({ crop: 'rice', fit: 80 })],
    );
    expect(merged[0].eligible.name).toBe('rice');
  });

  it('orders the rated ones by fit, sowable first', () => {
    const merged = mergeRanking(
      [eligible('a'), eligible('b'), eligible('c')],
      [
        crop({ crop: 'a', fit: 90, sowableNow: false }),
        crop({ crop: 'b', fit: 40, sowableNow: true }),
        crop({ crop: 'c', fit: 70, sowableNow: true }),
      ],
    );
    // A crop that cannot be sown this month sits below ones that can, even
    // with the better fit.
    expect(merged.map((m) => m.eligible.name)).toEqual(['c', 'b', 'a']);
  });

  it('matches on name regardless of case', () => {
    const merged = mergeRanking([eligible('Rice')], [crop({ crop: 'rice' })]);
    expect(merged[0].ranking).not.toBeNull();
  });

  it('keeps the scheme id, which is what adding a crop needs', () => {
    const merged = mergeRanking([eligible('rice', 'shc-123')], [crop({ crop: 'rice' })]);
    expect(merged[0].eligible.shcId).toBe('shc-123');
  });
});

describe('ordering the merged list', () => {
  // West Bengal lists rice twelve times — once per duration, irrigation and
  // season — against a single rice ranking. Keying the order by crop name
  // silently dropped eleven of them.
  const twelveRices = Array.from({ length: 12 }, (_, i) => eligible('rice', `rice-${i}`));

  it('keeps every variety of a crop, not just the first', () => {
    const merged = mergeRanking(
      [...twelveRices, eligible('wheat')],
      [crop({ crop: 'rice', fit: 90 }), crop({ crop: 'wheat', fit: 50 })],
    );
    const ordered = orderMerged(merged, 'profit');
    expect(ordered).toHaveLength(13);
    expect(ordered.filter((r) => r.eligible.name === 'rice')).toHaveLength(12);
  });

  it('keeps a crop\'s varieties together, in the ranking\'s place', () => {
    const merged = mergeRanking(
      [eligible('wheat'), ...twelveRices],
      [crop({ crop: 'rice', estimatedProfit: 90000 }), crop({ crop: 'wheat', estimatedProfit: 10000 })],
    );
    const names = orderMerged(merged, 'profit').map((r) => r.eligible.name);
    expect(names.slice(0, 12).every((n) => n === 'rice')).toBe(true);
    expect(names[12]).toBe('wheat');
  });

  it('leaves unrated crops at the bottom in the scheme\'s order', () => {
    const merged = mergeRanking(
      [eligible('arecanut'), eligible('betelvine'), eligible('rice')],
      [crop({ crop: 'rice' })],
    );
    const names = orderMerged(merged, 'profit').map((r) => r.eligible.name);
    expect(names).toEqual(['rice', 'arecanut', 'betelvine']);
  });
});
