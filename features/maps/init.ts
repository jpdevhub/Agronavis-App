import Mapbox from '@rnmapbox/maps';
import { Env } from '@/constants/env';

/**
 * Hands Mapbox its access token, once, for the whole app.
 *
 * This used to live at the top of FarmFieldDrawer, which meant the token was
 * set as a side effect of importing that one component. Any other screen with
 * a map — crop health, for one — mounted a MapView with no token at all and
 * the native module brought the app down with it. The field drawer worked
 * precisely because it was the file doing the setting.
 *
 * Imported for its side effect by the root layout, so it runs before any
 * screen renders regardless of which one the farmer opens first.
 *
 * Satellite imagery is on Mapbox's free tier, which is why this is not Google
 * Maps: that one watermarks every tile "for development purposes only" until
 * a billing account is attached.
 */
Mapbox.setAccessToken(Env.mapboxToken || null);

/** True when a token was actually configured; a map needs one to draw. */
export const mapsReady = Boolean(Env.mapboxToken);
