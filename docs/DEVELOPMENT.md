# Development

> **`main` is production.** Agronavis is published on Google Play, so nothing
> reaches `main` except through a reviewed pull request with CI green. The
> process is in [CONTRIBUTING.md](../CONTRIBUTING.md); cutting a release is in
> [RELEASING.md](RELEASING.md).

This repo is the Expo app. The API, the schema and the Render blueprint live in
[Agronavis-AI/backend-pro](https://github.com/Agronavis-AI/backend-pro) — the
app never touches the database, so every read and write goes through that API,
which is the only holder of the service-role key and the third-party keys.

## Quick start

```bash
git clone https://github.com/jpdevhub/Agronavis-App.git && cd Agronavis-App
cp .env.example .env
npm install --legacy-peer-deps
npm run dev                   # Expo on :8081
```

Node 22 (`.nvmrc`). `scripts/setup.sh` does the same and tells you which keys
are still blank. `EXPO_PUBLIC_API_URL` in `.env` picks the API: the deployed one
by default, or `http://localhost:3001/api/v1` against a backend checkout.

## Layout

The repo root **is** the React Native project. `app/` is expo-router's routes
directory; `packages/*` are npm workspaces underneath it.

| Path                                                                 | What it is                                                 |
| -------------------------------------------------------------------- | ---------------------------------------------------------- |
| `app/`                                                               | Expo Router screens — the app's routes                     |
| `components/` `hooks/` `services/` `store/` `constants/` `features/` | App source                                                 |
| `assets/`                                                            | Icons, splash, brand images and the India boundary file    |
| `modules/`                                                           | Native modules — the on-device Gemma runtime               |
| `packages/shared-types/`                                             | The API contract the app codes against                     |
| `.env`                                                               | The one environment file                                   |

One `package.json`, one `.env`, one `.gitignore`, one `tsconfig` — all at the
root. `packages/shared-types` keeps a minimal `package.json`, which npm
workspaces require. A single `npm install` sets up everything.

## Scripts

```bash
npm run dev            # Expo (alias: npm start)
npm run web            # Expo in the browser
npm run android        # native Android build and run

npm run verify         # typecheck + lint + test
npm run typecheck
npm run lint           # ESLint, for the Expo and React rules
npm run format         # Biome
npm test

npm run build:android  # EAS Android build
npm run legal          # regenerate TERMS.md and PRIVACY.md
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
plant is refused rather than answered. The backend repo's `tests/unit/vegetation.test.ts`
holds the colours that check is calibrated against.

Its `src/modules/crops/plant-gate.service.ts` is a stronger version of that
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

| Document                                                                              | Covers                       |
| ------------------------------------------------------------------------------------- | ---------------------------- |
| [backend-pro](https://github.com/Agronavis-AI/backend-pro)                              | The API, its schema and seeds |
