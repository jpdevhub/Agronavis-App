import type { CropSuggestion } from '@agronavis/shared-types';
import type { SortKey } from './formatting';

/**
 * Re-orders the list without ever shortening it.
 *
 * The farmer picked the measure, so that measure leads — but a crop that
 * cannot be sown this month still falls below one that can, whichever column
 * is being sorted. Offering the most profitable crop in the state as the top
 * line in a month nobody can plant it is the mistake this whole screen exists
 * to avoid.
 */
export function sortSuggestions(list: CropSuggestion[], key: SortKey): CropSuggestion[] {
  const sowableFirst = (a: CropSuggestion, b: CropSuggestion) =>
    Number(b.sowableNow) - Number(a.sowableNow);

  const by: Record<SortKey, (a: CropSuggestion, b: CropSuggestion) => number> = {
    // Unpriced crops cannot be compared on money and sit last rather than
    // first, which is what a plain null-as-zero sort would do.
    profit: (a, b) => (b.estimatedProfit ?? -Infinity) - (a.estimatedProfit ?? -Infinity),
    cost: (a, b) => a.estimatedInputCost - b.estimatedInputCost,
    water: (a, b) => waterRank(a) - waterRank(b),
    season: (a, b) => b.fit - a.fit,
  };

  return [...list].sort((a, b) => sowableFirst(a, b) || by[key](a, b));
}

/** Crops carry a watering note only when the rain falls short of their need. */
function waterRank(crop: CropSuggestion): number {
  const note = crop.cautions.find((c) => c.includes('mm short'));
  if (!note) return 0;
  const mm = Number(note.match(/(\d+)\s*mm/)?.[1] ?? 0);
  return mm;
}
