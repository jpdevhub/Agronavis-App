# Agronavis — System Architecture

AI-driven geospatial intelligence for Indian agriculture. One monorepo, one
database schema, one environment file, and exactly one path from the app to the
data.

---

## 1. The rule that shapes everything

**The mobile app never touches the database.** It authenticates with Supabase
Auth and sends that JWT to the Agronavis API; the API holds the service-role key
and every third-party API key, and is the only process that reads or writes.

That rule buys three things:

| | Before | Now |
|---|---|---|
| Secrets in the app bundle | OpenWeatherMap key shipped in the APK | Public Supabase anon key and Maps key only |
| Business logic | Split between 14 client files and the server | One place, testable, versioned |
| Access control | Row Level Security alone | Explicit ownership checks in the service layer, with RLS behind them |

```mermaid
graph LR
    subgraph Device["Farmer's phone"]
        UI["Expo app<br/>React Query · Zustand"]
        Auth["Supabase Auth SDK<br/>sign-in, session, refresh"]
    end

    subgraph Server["Agronavis API — Express"]
        JWT["JWT verification<br/>JWKS ES256 + HS256"]
        Own["Ownership guards"]
        Mod["Modules<br/>farms · crops · soil · advisory<br/>weather · market · community"]
        WS["Socket.IO"]
        Jobs["Cron jobs"]
    end

    subgraph Data["Supabase"]
        PG[("Postgres<br/>+ RLS")]
        Store["Storage buckets"]
        GoTrue["GoTrue"]
    end

    subgraph Upstream["Third-party, keys server-side only"]
        OWM["OpenWeatherMap"]
        NASA["NASA POWER"]
        AGMK["Agmarknet"]
        ML["ML service"]
    end

    Auth <--> GoTrue
    UI -- "Bearer JWT" --> JWT
    JWT --> Own --> Mod
    UI <-. "authenticated socket" .-> WS
    Mod --> PG
    Mod --> Store
    Mod --> OWM & NASA & AGMK & ML
    Jobs --> Mod
    Jobs --> WS
    WS --> UI
```

---

## 2. Repository layout

```
Agronavis/
├── .env / .env.example      One environment file for the whole repo
├── .gitignore               One ignore file
├── package.json             Root scripts and shared tooling
├── tsconfig.base.json       Shared compiler options
│
├── supabase/
│   ├── migrations/          The only schema definition
│   └── seed/                Reference data generators
│
├── packages/shared-types/   Database, REST and realtime contracts (types only)
│
├── backend/                 Express API + Socket.IO + cron
│   └── src/
│       ├── config/          env, logger, supabase client
│       ├── middleware/      auth, validation, errors, request context
│       ├── shared/          errors, ownership guards, cache, http helpers
│       ├── modules/         one folder per domain
│       ├── websocket/       Socket.IO server and emitters
│       └── jobs/            weather and market pollers
│
├── apps/mobile/             Expo app
│   ├── services/            api client + typed endpoints
│   ├── hooks/               React Query hooks, one per domain
│   ├── components/ui/       Material 3 primitives
│   └── app/                 expo-router screens
│
├── docs/                    Architecture, API, deployment, external services
└── render.yaml              Render blueprint for the API
```

Each workspace keeps its own `package.json` because npm workspaces and Expo
require it. Everything else — scripts, formatting, TypeScript config, env,
ignore rules — lives once, at the root.

---

## 3. Request path

```mermaid
sequenceDiagram
    autonumber
    participant App as Expo app
    participant API as Express API
    participant JWKS as Supabase JWKS
    participant DB as Postgres
    participant OWM as OpenWeatherMap

    App->>API: GET /weather/farm/:farmId<br/>Authorization: Bearer <supabase jwt>
    API->>JWKS: fetch signing keys (cached 10 min)
    JWKS-->>API: key set
    API->>API: verify signature, issuer, expiry → farmerId
    API->>DB: SELECT farms WHERE id = :farmId
    DB-->>API: row
    API->>API: assertOwnsFarm — 403 unless farmer_id matches
    API->>OWM: current + forecast (server-held key, 30 min cache)
    OWM-->>API: conditions
    API->>DB: UPSERT weather_snapshots
    API-->>App: { success: true, data: WeatherBundle }
```

Every endpoint returns the same envelope, so the client has one success path and
one failure path:

```ts
{ success: true,  data: T, meta?: { count, cached } }
{ success: false, error: string, code?: string, details?: unknown }
```

If OpenWeatherMap is unreachable the API serves the stored snapshot with
`meta.cached = true`, and the dashboard says so rather than showing an error.

---

## 4. Advisory generation

The irrigation advisory is a real water balance, not a threshold on temperature.

```mermaid
flowchart TD
    A["NASA POWER<br/>Tmax Tmin RH wind solar rain"] --> B["FAO-56 Penman-Monteith<br/>backend/src/modules/weather/et0.ts"]
    B --> C["ET0 mm/day"]
    C --> D["Deficit = Σ(ET0 − rainfall)<br/>over 3 days"]
    D -->|"> 18 mm"| E["Critical: irrigate today"]
    D -->|"10-18 mm"| F["High: irrigate within 48 h"]
    D -->|"4-10 mm"| G["Medium: check soil moisture"]
    D -->|"< 4 mm"| H["Silent — a satisfied<br/>balance is not news"]

    I["OpenWeatherMap<br/>5-day forecast"] --> J{Rules}
    J -->|"rain > 30 mm or POP ≥ 80%"| K["Heavy rain warning"]
    J -->|"Tmax ≥ 42 °C"| L["Extreme heat warning"]
    J -->|"wind ≥ 45 km/h"| M["Do not spray"]
    J -->|"2+ days RH ≥ 85%, 18-32 °C"| N["Fungal disease risk"]

    E & F & G & K & L & M & N --> O["UPSERT advisories<br/>ON CONFLICT (farm_id, dedupe_key)"]
    O --> P["Socket.IO advisory:new"]
    O --> Q["Expo push — critical only"]
```

`dedupe_key` is what makes a 30-minute poll safe: `irrigation:2026-09-04`
collides with itself, so the farmer gets one "irrigate today", not forty-eight.

---

## 5. Realtime

Sockets are authenticated at handshake with the same Supabase JWT, and joining a
farm room is ownership-checked. Without that, a guarded REST API would have an
unguarded side door.

| Room | Who joins | Events |
|---|---|---|
| `farmer:{id}` | Automatic, from the verified token | `notification:push` |
| `farm:{id}` | Only after `assertOwnsFarm` | `weather:update`, `advisory:new` |
| `district:{slug}` | Any signed-in user | `pest:alert`, `community:post` |
| `market:{state}` | Any signed-in user | `market:price` |

```mermaid
sequenceDiagram
    participant F1 as Farmer A
    participant API as API
    participant ML as ML service
    participant F2 as Every farmer in the district

    F1->>API: POST /crops/scans (image)
    API->>ML: classify
    ML-->>API: { disease, confidence }
    API->>API: store scan, create pest advisory
    API-->>F1: advisory:new
    alt confidence ≥ 0.75
        API-->>F2: pest:alert on district room
        Note over F2: Banner slides in,<br/>dismisses after 8 s
    end
```

---

## 6. Background jobs

| Job | Schedule | Work |
|---|---|---|
| Weather poll | `*/30 * * * *` | Groups farms by coordinates rounded to ~1 km, so a village costs one upstream call. Stores snapshots, regenerates advisories, emits and pushes. |
| Market poll | `15 * * * *` | One query per state and commodity that farmers actually grow, capped at six per state. Caches into `market_prices`. |

Both are wrapped in an overlap guard: a slow run is skipped, never stacked.
`ENABLE_JOBS=false` turns them off for a second API replica.

---

## 7. Data model

`supabase/migrations/*.sql` is the only schema definition. Types are generated
from the live database into `packages/shared-types/src/database.types.ts`, which
both the API and the app compile against.

```mermaid
erDiagram
    farmers ||--o{ farms : owns
    farmers ||--o{ advisories : receives
    farmers ||--o{ notifications : receives
    farmers ||--o{ community_posts : writes
    farms ||--o{ farm_fields : "mapped into"
    farms ||--o{ crops : grows
    farms ||--o{ farm_tasks : schedules
    farms ||--o{ weather_snapshots : caches
    farm_fields ||--o{ soil_health_history : tested
    crops ||--o{ crop_scans : scanned
    community_posts ||--o{ community_replies : answered
```

`farmers.id` is `auth.users.id` with `ON DELETE CASCADE`, so deleting the auth
user erases the farmer record — without it, account deletion fails and an
erasure request cannot be honoured. A signup trigger creates the row; the API
recreates it if the trigger ever failed, so a broken trigger cannot leave an
account permanently unusable.

Two tables are reference data rather than farmer data: `crop_varieties` (the
agronomy catalogue — duration, yield, water and NPK per variety) and
`crop_diseases` (symptoms and treatment per class). Both are readable by any
authenticated user and are cached for a day on the client.

---

## 8. The data flywheel

```mermaid
flowchart LR
    A["Farmer walks a boundary"] --> B["Verified GPS polygon"]
    C["Farmer registers a crop"] --> D["Known crop at known coordinates"]
    E["Farmer scans a diseased leaf"] --> F["Labelled image + location + date"]
    G["Farmer marks an advisory done"] --> H["Was the recommendation acted on"]

    B & D & F & H --> I[("Ground truth<br/>nobody else has")]
    I --> J["Retrain the classifier"]
    J --> K["Better advisories"]
    K --> A
```

Public satellite data is available to everyone. Verified field boundaries paired
with what was actually grown there, and whether the advice was followed, are not.

---

## 9. Roadmap

**Shipped**

Repo consolidation; Supabase JWT auth replacing the Clerk mismatch; the full
REST surface with ownership guards; authenticated realtime; FAO-56 irrigation
advisories; live mandi prices; TOTP two-factor; Material 3 mobile UI.

**Not built, and not faked in the UI**

Automatic disease detection from a photo. The scan screen files the image
against the farm and asks the farmer to identify it from the `crop_diseases`
library; it does not print a confidence score for a model that does not exist.
Every scan filed this way is a labelled image, which is what a classifier would
need to be trained on.

**Next**

The disease classifier itself; Sahayak WebRTC consultation; vernacular voice
interface; offline-first persistence; XGBoost crop classifier over Sentinel-1
SAR and Sentinel-2 optical; the enterprise Next.js console for canal water
management, insurance verification and carbon MRV.
