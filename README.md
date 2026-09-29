# Agronavis

AI-driven geospatial intelligence for Indian agriculture. A farmer maps a field
once, and the platform watches the weather, the water balance, the soil and the
mandi for that exact plot.

An Expo app, an Express API and a Supabase project. The app never touches the
database: every read and write goes through the API, which is the only holder of
the service-role key and the third-party API keys.

## Quick start

```bash
git clone https://github.com/jpdevhub/Agronavis-App.git && cd Agronavis-App
cp .env.example .env          # see docs/free-apis.md for where each key comes from
npm install --legacy-peer-deps
npm run db:push               # apply supabase/migrations to your project
npm run dev                   # API on :3001, Expo on :8081
```

Node 20 or newer. `scripts/setup.sh` does the same and tells you which keys are
still blank.

## Layout

The repo root **is** the React Native project. `app/` is expo-router's routes
directory; `backend` and `packages/*` are npm workspaces underneath it.

| Path | What it is |
|---|---|
| `app/` | Expo Router screens — the app's routes |
| `components/` `hooks/` `services/` `store/` `constants/` `features/` | App source |
| `assets/` | Icons, splash and brand images |
| `backend/` | Express REST API, Socket.IO and the cron pollers |
| `packages/shared-types/` | Type contracts shared by the app and the API |
| `supabase/migrations/` | The only schema definition |
| `docs/` | Architecture, API reference, deployment, external services |
| `.env` | The one environment file, read by both the app and the API |
| `render.yaml` | Render blueprint for the API |

One `package.json`, one `.env`, one `.gitignore`, one `tsconfig` — all at the
root. `backend` and `packages/shared-types` keep a minimal `package.json` each,
which npm workspaces require. A single `npm install` sets up everything.

## Documentation

| Document | Covers |
|---|---|
| [Architecture](docs/architecture/system-architecture.md) | How a request flows, why the app cannot reach Postgres, the advisory engine |
| [API reference](docs/api/README.md) | Every route, the response envelope, the realtime events |
| [External services](docs/free-apis.md) | Which APIs are used, which are free, where each key comes from |
| [Deploying to Render](docs/deployment/render.md) | The blueprint, the secrets, and what the free plan actually costs |
| [Database](supabase/README.md) | Migration workflow |

## Scripts

```bash
npm run dev            # API and app together
npm run dev:api        # API only
npm start              # Expo only (alias: npm run dev:app)
npm run web            # Expo in the browser
npm run android        # native Android build and run

npm run verify         # typecheck + lint + test, app and API
npm run typecheck
npm run lint
npm test

npm run db:link        # link the Supabase project named in .env
npm run db:push        # apply pending migrations
npm run db:types       # regenerate database.types.ts from the live schema

npm run build:api      # compile the API to backend/dist
npm run start:api      # run the compiled API (what Render runs)
npm run build:android  # EAS Android build
```

## How it fits together

The app authenticates with Supabase Auth and sends that JWT to the API. The API
verifies it against the project's JWKS, checks that the caller owns the row it
is about to touch, and is the only process that reaches Postgres, Storage,
OpenWeatherMap, NASA POWER and Agmarknet.

Two consequences worth stating plainly:

- **No API key that matters ships inside the app bundle.** `EXPO_PUBLIC_*`
  values are extractable from the APK, so only the Supabase publishable key and
  the Maps SDK key carry that prefix.
- **The service-role key bypasses Row Level Security**, so ownership is checked
  explicitly in the service layer. RLS is the second line of defence, not the
  first.

Irrigation advice is a real water balance, not a rule of thumb: reference
evapotranspiration by FAO-56 Penman-Monteith, computed from NASA POWER solar
radiation, temperature, humidity and wind, minus measured rainfall.

## Status

Working end to end: authentication with optional TOTP, field mapping, weather
and ET₀, soil estimates, the advisory engine, mandi prices, the crop and disease
catalogues, community posts, tasks, push and in-app notifications.

Not yet built, and not pretended otherwise in the UI: automatic crop-disease
detection from a photo. The scan screen stores the image against the farm and
lets the farmer identify it from the disease library instead of inventing a
diagnosis.
