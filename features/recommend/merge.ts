import type { CropSuggestion, EligibleCrop } from '@agronavis/shared-types';
import { sortSuggestions } from './sorting';
import type { SortKey } from './formatting';

/**
 * The scheme's crop list, with a ranking attached where one exists.
 *
 * Two sources that do not line up. The scheme lists what a state may grow —
 * 63 crops in West Bengal, 117 in Karnataka, each with its own variety and
 * season — and carries the id needed to actually add one. The ranking knows
 * 43 crops in depth and nothing about varieties.
 *
 * Joining on the crop name keeps both: every eligible crop stays on the list,
 * and the ones we can rank carry their fit and their money. A crop we have no
 * profile for is marked unrated rather than dropped — the scheme says it grows
 * here, and that is the farmer's to weigh.
 */

export interface RankedCrop {
  /** What the farmer taps to add. Always present. */
  eligible: EligibleCrop;
  /** Null when no profile covers this crop yet. */
  ranking: CropSuggestion | null;
}

export function mergeRanking(
  eligible: EligibleCrop[],
  suggestions: CropSuggestion[],
): RankedCrop[] {
  const byName = new Map(suggestions.map((s) => [s.crop.toLowerCase(), s]));

  const merged = eligible.map((crop) => ({
    eligible: crop,
    ranking: byName.get(crop.name.toLowerCase()) ?? null,
  }));

  // Ranked crops first, best fit at the top; the unrated keep the scheme's
  // own order below them so the list stays stable between openings.
  return merged.sort((a, b) => {
    if (a.ranking && b.ranking) {
      return (
        Number(b.ranking.sowableNow) - Number(a.ranking.sowableNow) ||
        b.ranking.fit - a.ranking.fit
      );
    }
    return Number(Boolean(b.ranking)) - Number(Boolean(a.ranking));
  });
}

/**
 * The merged list in the order the farmer should read it.
 *
 * A crop name covers several catalogue rows — West Bengal lists rice twelve
 * times, once per duration, irrigation and season — and the ranking has one
 * entry for all of them. So the ranking orders the crop names and every row
 * under a name follows it, keeping the varieties together and keeping all of
 * them. Unrated crops hold the scheme's order at the bottom.
 */
export function orderMerged(list: RankedCrop[], sort: SortKey): RankedCrop[] {
  const groups = new Map<string, RankedCrop[]>();
  const unrated: RankedCrop[] = [];

  for (const row of list) {
    if (!row.ranking) {
      unrated.push(row);
      continue;
    }
    const existing = groups.get(row.ranking.crop);
    if (existing) existing.push(row);
    else groups.set(row.ranking.crop, [row]);
  }

  const ranking = sortSuggestions(
    [...groups.values()].map((rows) => rows[0].ranking as CropSuggestion),
    sort,
  );

  return [...ranking.flatMap((s) => groups.get(s.crop) ?? []), ...unrated];
}

/** How many of a state's crops the ranking actually covers. */
export function rankedCount(list: RankedCrop[]): number {
  return list.filter((c) => c.ranking !== null).length;
}
