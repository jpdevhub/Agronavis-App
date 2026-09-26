export interface ScreenInfo {
  /** What the farmer is looking at. */
  name: string;
  /** What they can do from here, so Sahayak can give directions that work. */
  actions: string[];
}

/**
 * Routes are matched longest-prefix first, so `/farm/map` wins over `/farm`.
 * Every entry corresponds to a real screen in `app/`.
 */
const SCREENS: [string, ScreenInfo][] = [
  ['/farm/map', { name: 'Map a field', actions: ['tap four corners on the satellite map to trace a field boundary', 'name the field and save it'] }],
  ['/farm/fields', { name: 'Mapped fields', actions: ['switch the active field', 'delete a field'] }],
  ['/farm', { name: 'My Farms', actions: ['see every farm and field', 'map a new field'] }],
  ['/scan/result', { name: 'Scan result', actions: ['identify the photographed problem from the disease library', 'save the scan against the farm'] }],
  ['/scan', { name: 'Crop scanner', actions: ['photograph a crop for a disease check'] }],
  ['/community', { name: 'Community and Live Mandi', actions: ['read and post to the farmer feed', 'look up today’s mandi rates by state and district'] }],
  ['/dashboard', { name: 'Dashboard', actions: ['see weather, soil nutrients, tasks and advisories for the active field'] }],
  ['/crops', { name: 'Crop catalogue', actions: ['browse crop varieties with their water, duration and nutrient needs', 'add crops to a field'] }],
  ['/profile/security', { name: 'Security settings', actions: ['turn two-factor authentication on or off'] }],
  ['/profile/edit', { name: 'Edit profile', actions: ['change name, phone, state and district'] }],
  ['/profile', { name: 'Profile', actions: ['review account details', 'sign out'] }],
];

const PLATFORM = [
  'Agronavis can do the following, and nothing else:',
  '- Map field boundaries on a satellite map and compute their area',
  '- Show weather and a Penman-Monteith irrigation water balance per field',
  '- Estimate soil nutrients from Soil Health Card data for the district',
  '- Generate irrigation, pest, weather and fertiliser advisories',
  '- Show mandi prices from Agmarknet and eNAM by state and district',
  '- Photograph a crop and match it against a disease reference library',
  '- Keep a crop calendar of tasks, and a farmer community feed',
];

export function screenInfoFor(pathname: string): ScreenInfo | null {
  const match = SCREENS.find(([prefix]) => pathname.includes(prefix));
  return match ? match[1] : null;
}

export function platformSection(): string[] {
  return PLATFORM;
}
