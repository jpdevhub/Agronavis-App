import type { AlertCategory } from '@agronavis/shared-types';

/**
 * The alert categories the onboarding switches offer, as a runtime list.
 *
 * The backend keeps its own copy for the same reason: `@agronavis/shared-types`
 * points `main` at TypeScript source, so it can export types but not values —
 * a real import from it stops the built API booting. Both lists are checked
 * against the same union, and a test asserts they still agree.
 */
export const ALERT_CATEGORIES = [
  'weather_alert',
  'irrigation',
  'pest_control',
] as const satisfies readonly AlertCategory[];

/** Fails to compile if a category in the union is missing from the list. */
type Unlisted = Exclude<AlertCategory, (typeof ALERT_CATEGORIES)[number]>;
const everyCategoryIsListed: Unlisted extends never ? true : never = true;
void everyCategoryIsListed;
