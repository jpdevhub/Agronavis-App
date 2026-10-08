/**
 * Holds the photograph between the camera and the result screen.
 *
 * The obvious route — `router.push({ params: { imageUri } })` — works on a
 * device, where the camera hands back a short `file://` path. On the web the
 * camera hands back the whole picture as a `data:` URI, the router writes it
 * into the address bar, and the request dies before it reaches us with
 * HTTP 431: the URL is megabytes long. So the picture stays in memory and only
 * a ticket travels through the URL.
 *
 * One capture is kept at a time. That is all the flow ever needs, and it means
 * a photograph is never left behind in memory after the farmer moves on.
 */
export type Capture = { id: string; uri: string };

let current: Capture | null = null;
let issued = 0;

/**
 * Stores a freshly taken or picked photograph and returns its ticket.
 *
 * The ticket counts rather than reading the clock: two captures can land in the
 * same millisecond, and a shared id would let the old result screen's cleanup
 * release the new screen's photograph.
 */
export function holdCapture(uri: string): string {
  issued += 1;
  current = { id: `cap-${issued}`, uri };
  return current.id;
}

/** Returns the photograph for a ticket, or null once it has been released. */
export function readCapture(id: string | undefined): string | null {
  if (!id || !current || current.id !== id) return null;
  return current.uri;
}

/** Drops the held photograph. Called when the result screen goes away. */
export function releaseCapture(id: string | undefined): void {
  if (id && current?.id === id) current = null;
}
