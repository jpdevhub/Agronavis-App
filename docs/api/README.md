# API reference

Base URL: `${API}/api/v1`. Every route below requires
`Authorization: Bearer <supabase access token>`; there are no anonymous
endpoints besides `/health` and `/`.

## Envelope

Every response is wrapped. Nothing returns a bare array or object.

```jsonc
// success
{ "success": true, "data": <T>, "meta": { "count": 12, "cached": false } }

// failure
{ "success": false, "error": "Field not found", "code": "NOT_FOUND", "details": null }
```

`meta` is present only where it carries something — a collection count, or a
flag that the payload came from cache.

## Authentication

The app signs in with Supabase Auth and forwards the resulting access token. The
API verifies it against the project's JWKS (ES256), falling back to HS256 only
if `SUPABASE_JWT_SECRET` is set for a legacy project. The verified `sub` claim is
the farmer id, and every query is scoped to it.

Failure modes: `401` for a missing, malformed or expired token; `403` when the
token is valid but the row belongs to someone else.

## Routes

### `auth`

| Method | Path | Purpose |
|---|---|---|
| GET | `/auth/me` | User, farmer profile and 2FA status in one call. Drives startup routing. |
| GET | `/auth/2fa/status` | Whether TOTP is enrolled |
| POST | `/auth/2fa/setup` | Returns the secret, an `otpauth://` QR and backup codes |
| POST | `/auth/2fa/verify` | Confirms enrolment with a 6-digit code |
| POST | `/auth/2fa/verify-backup` | Consumes one single-use backup code |
| POST | `/auth/2fa/backup-codes` | Regenerates the codes; invalidates the old set |
| DELETE | `/auth/2fa` | Disables TOTP |

### `farmers`

| Method | Path | Purpose |
|---|---|---|
| GET | `/farmers/me` | Profile |
| PATCH | `/farmers/me` | Partial update; also flips `onboarding_complete` |
| POST | `/farmers/me/push-token` | Registers the device's Expo push token |

### `farms`

| Method | Path | Purpose |
|---|---|---|
| GET | `/farms` | Farms owned by the caller |
| GET | `/farms/:id` | One farm |
| PATCH | `/farms/:id` | Update name, area, soil, irrigation, location |
| GET | `/farms/fields` | Every mapped field across every owned farm |
| POST | `/farms/fields` | Creates a field from a GeoJSON ring; area is computed server-side |
| GET | `/farms/fields/:id` | One field |
| PATCH | `/farms/fields/:id` | Rename |
| DELETE | `/farms/fields/:id` | Remove |

Field creation takes the polygon as either a GeoJSON `Polygon` or a bare
`[[lng, lat], …]` ring. Acreage is recomputed from the geometry rather than
trusted from the client, and the first field also fixes the farm's coordinates.

### `crops`

| Method | Path | Purpose |
|---|---|---|
| GET | `/crops` | The caller's crops; filter by `fieldId`, `status` |
| POST | `/crops` | Plant a crop. A database trigger fans the timeline out into tasks |
| PATCH | `/crops/:id` | Update |
| DELETE | `/crops/:id` | Remove |
| GET | `/crops/varieties` | Agronomy catalogue: duration, yield, water, pH, NPK per variety |
| GET | `/crops/diseases` | Disease library; filter by `cropType`, `search` |
| GET | `/crops/diseases/:classKey` | One reference card with symptoms and treatment |
| GET | `/crops/scans` | Scan history |
| POST | `/crops/scans` | Files a scan against a farm |

`/crops/varieties` and `/crops/diseases` are reference data, identical for every
caller, and are cached for a day on the client.

### `tasks`

| Method | Path | Purpose |
|---|---|---|
| GET | `/tasks` | Timeline; optional `farmId` |
| POST | `/tasks` | Create |
| PATCH | `/tasks/:id/complete` | Mark done |
| PATCH | `/tasks/:id/skip` | Mark skipped |

### `soil`

| Method | Path | Purpose |
|---|---|---|
| GET | `/soil/field/:fieldId` | Latest reading, or a district estimate when none exists |
| GET | `/soil/field/:fieldId/history` | Series |
| POST | `/soil/field/:fieldId` | Record a lab or field test |

With no measured reading, the estimate comes from `regional_soil_data` via the
`get_estimated_soil_health` function, keyed on the field's district.

### `advisory`

| Method | Path | Purpose |
|---|---|---|
| GET | `/advisory` | Across all owned farms |
| GET | `/advisory/farm/:farmId` | For one farm |
| POST | `/advisory/farm/:farmId/generate` | Re-runs the rules now |
| POST | `/advisory/farm/:farmId/pest` | Raises a pest alert |
| PATCH | `/advisory/:id/read` | Mark read |
| PATCH | `/advisory/read-all` | Mark all read |

Advisories carry a `dedupe_key` unique per farm, so a poller running every
30 minutes produces one "irrigate today", not 48.

### `weather`

| Method | Path | Purpose |
|---|---|---|
| GET | `/weather` | Current, forecast and water balance for the active farm |
| GET | `/weather/farm/:farmId` | Same, for a named farm |
| GET | `/weather/current` | Conditions only |
| GET | `/weather/forecast` | Five days |
| GET | `/weather/solar` | NASA POWER radiation and the derived ET₀ |

The water deficit is FAO-56 Penman-Monteith reference evapotranspiration
computed from NASA POWER inputs, minus measured rainfall. See
[`backend/src/modules/weather/et0.ts`](../../backend/src/modules/weather/et0.ts).

### `market`

| Method | Path | Purpose |
|---|---|---|
| GET | `/market/prices` | Mandi rows for a commodity and state |
| GET | `/market/trend` | Median modal price per day, with direction |
| GET | `/market/dashboard` | One row per crop the farmer grows |

### `community`

| Method | Path | Purpose |
|---|---|---|
| GET | `/community/posts` | Feed |
| POST | `/community/posts` | Create |
| DELETE | `/community/posts/:id` | Delete your own |
| POST | `/community/posts/:id/vote` | Toggle upvote |
| GET | `/community/posts/:postId/replies` | Replies |
| POST | `/community/posts/:postId/replies` | Reply |
| DELETE | `/community/replies/:id` | Delete your own |

Author details are joined through an explicit column list, so the 2FA columns
cannot leak into a public feed.

### `notifications`

| Method | Path | Purpose |
|---|---|---|
| GET | `/notifications` | Inbox |
| PATCH | `/notifications/:id/read` | Mark read |
| PATCH | `/notifications/read-all` | Mark all read |

### `storage`

| Method | Path | Purpose |
|---|---|---|
| POST | `/storage/:bucket` | Multipart upload |
| GET | `/storage/:bucket/signed-url` | Re-sign a private object |
| DELETE | `/storage/:bucket` | Delete by `path` |

Buckets are `avatars`, `community-media` (both public) and `crop-scans`
(private — a diseased-crop photo is tied to a farmer's location, so it is served
back over a signed URL).

## Realtime

Socket.IO on the same origin. The handshake carries the same bearer token and is
verified identically; joining `farm:{id}` is refused unless the caller owns that
farm.

| Event | Payload |
|---|---|
| `advisory:new` | A freshly generated advisory |
| `weather:update` | New conditions for a farm |
| `notification` | Mirrors what was pushed via Expo |
