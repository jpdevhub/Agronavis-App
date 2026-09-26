/**
 * Largest area a single field can plausibly have.
 *
 * Boundaries traced on a zoomed-out map produce polygons of hundreds of square
 * kilometres. Those rows exist from before the drawer enforced a limit, and a
 * 1.7-million-acre "field" must not be summed into totals or fed to Sahayak as
 * fact.
 */
export const MAX_FIELD_ACRES = 5_000;

export const isPlausibleField = (areaAcres: number): boolean =>
  Number.isFinite(areaAcres) && areaAcres > 0 && areaAcres <= MAX_FIELD_ACRES;
