# External services

Agronavis runs on free tiers end to end. Nothing here needs a paid plan, and
only two of the six services need a key at all.

## What the platform calls

| Service | Used for | Key | Free allowance |
|---|---|---|---|
| **Supabase** | Postgres, Auth, Storage | yes | 500 MB database, 1 GB storage, 50k monthly active users |
| **NASA POWER** | Solar radiation, temperature, humidity and wind for the ET₀ water balance | **none** | Unrestricted public API |
| **OpenWeatherMap** | Current conditions and the 5-day forecast | yes | 1,000 calls/day, 60/minute |
| **data.gov.in (Agmarknet)** | Daily mandi prices | yes | Free, rate-limited per key |
| **Expo Push** | Push notifications | **none** | Free, unmetered |
| **Google Maps SDK** | Satellite basemap in the field drawer | yes | Mobile map loads are not billed; a Cloud billing account must exist on the project |

Every key except the Maps one is read only by the API. `EXPO_PUBLIC_*` values
are compiled into the APK and can be extracted from it, so no secret is ever
given that prefix.

## Where to get each key

### Supabase — `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

[supabase.com](https://supabase.com) ▸ your project ▸ **Project Settings ▸ API Keys**.

- `SUPABASE_SERVICE_ROLE_KEY` is the **secret** key. It bypasses Row Level
  Security and belongs only in the API's environment.
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` is the **publishable** key. It is public by
  design and only ever holds the user's auth session.
- Both must come from the *same project* as `SUPABASE_URL`. A key from another
  project returns `401 Invalid API key` on every request.

`SUPABASE_JWT_SECRET` is **not needed** on projects that sign access tokens with
ES256 — the API fetches the public keys from the project's JWKS endpoint. Leave
it blank unless your project still issues legacy HS256 tokens.

### OpenWeatherMap — `OPENWEATHER_API_KEY`

[openweathermap.org/api](https://openweathermap.org/api) ▸ sign up ▸ **API keys**.

The API calls `/data/2.5/weather` and `/data/2.5/forecast`, both in the free
*Current Weather and Forecasts* collection — no payment method required. (One
Call 3.0 does ask for a card; the platform deliberately does not use it.)

A new key takes up to two hours to activate. Until then the weather endpoints
return 401 from upstream.

### data.gov.in — `AGMARKNET_API_KEY`

1. Register at [data.gov.in](https://data.gov.in).
2. Open your profile menu and copy the **API key** shown there.
3. Subscribe to *Current Daily Price of Various Commodities from Various
   Markets (Mandi)*, resource `9ef84268-d588-465a-a308-a864a43d0070`.

Without it the market widget renders empty and the API logs
`AGMARKNET_API_KEY is not set — mandi prices will be empty`. Nothing else breaks.

### Google Maps — `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`

[console.cloud.google.com](https://console.cloud.google.com) ▸ create a project
▸ enable **Maps SDK for Android** (and iOS) ▸ **Credentials ▸ Create API key**.

Restrict the key by Android package name (`com.agronavis.app`) and SHA-1
certificate fingerprint before shipping it — the key travels inside the APK.

Google does not bill mobile map loads, but it does require a billing account on
the Cloud project. If you would rather not attach a card at all, the drawer can
be moved to MapLibre with OpenStreetMap raster tiles, which needs no account —
at the cost of losing the satellite imagery the field drawer is designed around.

### Generated locally, not obtained — `TOTP_ENCRYPTION_KEY`

Not a third-party credential. It encrypts TOTP secrets at rest with AES-256-GCM:

```bash
openssl rand -base64 48
```

Changing it makes every existing two-factor enrolment undecryptable, so treat it
as permanent per environment. On Render it is generated once by the blueprint.

## Current state of this repository's `.env`

| Variable | Status |
|---|---|
| `SUPABASE_URL` | set |
| `SUPABASE_SERVICE_ROLE_KEY` | set |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | set |
| `OPENWEATHER_API_KEY` | set |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | set |
| `TOTP_ENCRYPTION_KEY` | generated |
| `AGMARKNET_API_KEY` | **empty — the only key still needed** |
| `SUPABASE_JWT_SECRET` | intentionally empty (project signs with ES256) |

## Staying inside the free tiers

The pollers exist so that upstream call volume scales with the number of
*distinct locations and states*, not with the number of app launches.

- **Weather** clusters farms by coordinates rounded to roughly 1 km, so ten
  farms in one village cost one OpenWeatherMap call. At the default
  `*/30 * * * *` that is 48 calls per cluster per day — about 20 clusters before
  the 1,000/day ceiling matters.
- **Market prices** are fetched hourly per state and commodity and cached in
  `market_prices`, then served from Postgres.
- **NASA POWER** is unmetered but slow; responses are held in an in-process TTL
  cache.

If you approach a limit, widen the cron expressions in `.env` rather than
disabling a feature.
