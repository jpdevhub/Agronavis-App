# Development

An Expo app, an Express API and a Supabase project. The app never touches the
database: every read and write goes through the API, which is the only holder of
the service-role key and the third-party API keys.

## Quick start

```bash
git clone https://github.com/jpdevhub/Agronavis-App.git && cd Agronavis-App
cp .env.example .env
npm install --legacy-peer-deps
npm run db:push               # apply supabase/migrations to your project
npm run dev                   # API on :3001, Expo on :8081
```

Node 20 or newer. `scripts/setup.sh` does the same and tells you which keys are
still blank.

## Layout

The repo root **is** the React Native project. `app/` is expo-router's routes
directory; `backend` and `packages/*` are npm workspaces underneath it.

| Path                                                                 | What it is                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| `app/`                                                               | Expo Router screens — the app's routes                     |
| `components/` `hooks/` `services/` `store/` `constants/` `features/` | App source                                                 |
| `assets/`                                                            | Icons, splash and brand images                             |
| `backend/`                                                           | Express REST API, Socket.IO and the cron pollers           |
| `backend/model/`                                                     | The disease classifier's weights, served in-process        |
| `packages/shared-types/`                                             | Type contracts shared by the app and the API               |
| `supabase/migrations/`                                               | The only schema definition                                 |
| `.env`                                                               | The one environment file, read by both the app and the API |
| `render.yaml`                                                        | Render blueprint for the API                               |

One `package.json`, one `.env`, one `.gitignore`, one `tsconfig` — all at the
root. `backend` and `packages/shared-types` keep a minimal `package.json` each,
which npm workspaces require. A single `npm install` sets up everything.

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
radiation, temperature, humidity and wind, minus measured rainfall. The
implementation is checked against the worked example published in FAO-56.

## The leaf scanner

The classifier is a residual network exported to ONNX and run in-process by the
API — about 43 MB of weights, roughly 120 MB of resident memory and a second per
photograph. It runs in the same service rather than a second one so that a small
instance can host the whole API; the alternative stack needed over a gigabyte
before a request arrived.

The model is forced to return one of its 86 labels for any image at all, so a
photograph of a wall or a person still produces a winner — measured directly, a
grey wall scored a _higher_ top logit than a healthy leaf. A vegetation check on
the decoded frame therefore runs first, and a photograph that does not show a
plant is refused rather than answered. `backend/tests/unit/vegetation.test.ts`
holds the colours that check is calibrated against.

`backend/src/modules/crops/plant-gate.service.ts` is a stronger version of that
check, using a second pretrained model. It is deliberately not wired in: its
thresholds have to be measured against real leaf photographs first, and its
weights are not committed. The file header says where to fetch them.

## Uploads

`services/api.ts` sends multipart differently per platform. React Native accepts
a `{ uri }` descriptor and streams the file itself; a browser stringifies that
and sends a text field, so on web the uri is read into a Blob first. The content
type must also be cleared on web — left alone, the client's default
`application/json` survives and axios silently serialises the form to JSON,
dropping the file. Both failures look identical from the app, so
`services/__tests__/upload.test.ts` asserts what goes on the wire.

## Documentation

| Document                          | Covers             |
| --------------------------------- | ------------------ |
| [Database](../supabase/README.md) | Migration workflow |
