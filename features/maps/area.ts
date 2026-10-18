/**
 * Field area in the units an Indian farmer actually uses.
 *
 * Acres are the wrong unit for most of what this app will measure. A katha in
 * West Bengal is 720 square feet — 0.0165 of an acre — so a farmer mapping one
 * sees "~0.02 acres", which tells them nothing and looks like the app got it
 * wrong. Smallholdings are the normal case here, not the edge: well over half
 * of Indian operational holdings are under one hectare.
 *
 * Local units are genuinely regional and getting one wrong is worse than not
 * offering it, so only the ones with a settled definition in a known state are
 * named. Square metres carry everything else: unambiguous, and the unit land
 * records already use.
 */

const SQM_PER_ACRE = 4046.8564224;

/** Bengal katha: 720 sq ft, 20 to the bigha. Settled, and widely used. */
const SQM_PER_KATHA_BENGAL = 66.8902;

/** Guntha: 1089 sq ft, 40 to the acre across the Deccan states. */
const SQM_PER_GUNTHA = 101.1714;

const KATHA_STATES = new Set(['west bengal', 'assam', 'tripura']);
const GUNTHA_STATES = new Set(['maharashtra', 'karnataka', 'andhra pradesh', 'telangana', 'goa']);

export function acresToSqm(acres: number): number {
  return acres * SQM_PER_ACRE;
}

/**
 * How to describe this area, most useful unit first.
 *
 * Below about a fifth of an acre, acres stop conveying anything and the local
 * unit leads instead. Above it, acres lead and the local unit follows — a
 * farmer who thinks in bighas should not have to convert to check the app
 * measured their land correctly.
 */
export function describeArea(acres: number, state?: string | null): string {
  if (!Number.isFinite(acres) || acres <= 0) return '—';

  const sqm = acresToSqm(acres);
  const key = (state ?? '').trim().toLowerCase();

  const local =
    KATHA_STATES.has(key)
      ? { value: sqm / SQM_PER_KATHA_BENGAL, unit: 'katha' }
      : GUNTHA_STATES.has(key)
        ? { value: sqm / SQM_PER_GUNTHA, unit: 'guntha' }
        : null;

  const round = (n: number) => (n >= 100 ? Math.round(n) : Number(n.toFixed(n >= 10 ? 1 : 2)));

  // Small plot: lead with something that has a number a farmer recognises.
  if (acres < 0.2) {
    const head = local
      ? `~${round(local.value)} ${local.unit}`
      : `~${Math.round(sqm).toLocaleString('en-IN')} m²`;
    return local ? `${head} · ${Math.round(sqm).toLocaleString('en-IN')} m²` : head;
  }

  const head = `~${round(acres)} acre${round(acres) === 1 ? '' : 's'}`;
  return local ? `${head} · ${round(local.value)} ${local.unit}` : head;
}
