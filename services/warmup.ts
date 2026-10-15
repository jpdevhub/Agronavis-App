import { Env } from '@/constants/env';

/**
 * Wakes the API before anyone is waiting on it.
 *
 * The API runs on an instance that sleeps after fifteen minutes idle, and the
 * first request to a sleeping one waits for a container to boot — thirty to
 * forty seconds, against a quarter of a second once it is up. Signing in was
 * paying that in full, because the first request anything made was the one the
 * sign-in blocked on.
 *
 * Calling this when an auth screen opens moves the boot to while the farmer is
 * still typing their password. It is deliberately fire-and-forget: nothing
 * waits on it, nothing fails because of it, and a second call while one is in
 * flight does nothing.
 */
const HEALTH_URL = Env.apiUrl.replace(/\/api\/v\d+\/?$/, '') + '/health';

let inFlight: Promise<void> | null = null;
let wokeAt = 0;

/** A wake is good for roughly as long as the instance stays up. */
const STAYS_WARM_MS = 10 * 60_000;

export function warmApi(): void {
  if (inFlight) return;
  if (Date.now() - wokeAt < STAYS_WARM_MS) return;

  inFlight = fetch(HEALTH_URL, { method: 'GET' })
    .then(() => {
      wokeAt = Date.now();
    })
    .catch(() => {
      // Offline, or the instance is still booting. Either way the sign-in
      // itself will report what went wrong; this is only a head start.
    })
    .finally(() => {
      inFlight = null;
    });
}
