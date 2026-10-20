# Agronavis — System Architecture
*As of 19 October 2026 · v1.2.0*

> The repo root **is** the React Native app. `backend/` is an npm workspace
> beneath it — not a sibling directory.

---

## 1. System Overview

```
Farmer App (Expo React Native)
        │  Supabase JWT on every request
        ▼
Express API  (backend/)
        ├── /weather        → OpenWeatherMap + NASA POWER (FAO-56 ET₀)
        ├── /advisory       → Irrigation / weather / fungal risk engine
        ├── /market         → Agmarknet (bundled locally + refresh)
        ├── /crops/scan     → ONNX ResNet in-process (86 conditions, 19 crops, ~1 sec)
        ├── /satellite      → Element 84 STAC + Cloud-Optimised GeoTIFF (range requests)
        ├── /satellite/ndvi → Stored Sentinel-2 readings (nightly cron job)
        ├── /fires          → NASA FIRMS active fire / stubble burn points
        ├── /soil           → Govt Soil Health Card (712 districts, 32 states)
        ├── /tasks          → Farm task timeline (1,812 crops, 31 states)
        ├── /notifications  → Expo Push (no 3rd-party service)
        └── /auth           → JWT verify + TOTP 2FA (speakeasy, AES-256)
                │
        Supabase Postgres   (supabase/migrations/ — single schema source)
        Supabase Storage    (crop scan images)
```

---

## 2. NDVI Pipeline — How Satellite Data Gets to the Screen

**Cost = 0. No account anywhere.**

```
Nightly Cron Job (per active field)
        │
        ├─ POST Element84 STAC /search
        │       bbox=field, cloud_cover < 20%, sentinel-2-l2a
        │       → Scene list with per-scene EPSG + asset URLs
        │
        ├─ HTTP Range request → B04 (red) window over field only
        ├─ HTTP Range request → B08 (NIR) window
        ├─ HTTP Range request → SCL (cloud classification, 20 m)
        │
        ├─ Convert lat/lon → UTM using scene's EPSG (proj4)
        ├─ Per-pixel SCL mask: keep only 4=veg, 5=bare, 7=unclassified
        │       Drop: cloud (8,9), cirrus (10), shadow (2,3), water (6), snow (11)
        ├─ Skip pass if <40% usable pixels
        │
        ├─ NDVI = (NIR − red) / (NIR + red)   [mean + 20×20 grid]
        └─ INSERT ndvi_readings (captured_on, ndvi, pixels, cloud_percent, grid)

API request (GET /satellite/ndvi?fieldId=)
        │
        ├─ SELECT last 2 rows WHERE grid IS NOT NULL   ← one DB query, no AWS call
        ├─ Encode grid → PNG data URI (pngjs, brown→green ramp)
        └─ Return {latest, previous, change, available, heatmapDataUri}
```

**Why range requests are the whole trick:** A Sentinel-2 band is >100 MB. A field
is ~20×20 pixels. The job pulls only those bytes via HTTP Range headers.
Parsing the GeoTIFF index takes ~24 s; this is why it is a nightly job and
not a request path.

---

## 3. Advisory Rules Engine

```
NASA POWER daily values (lat/lon, no key)
    ALLSKY_SFC_SW_DWN  → net radiation Rn
    T2M_MAX, T2M_MIN   → temperature range
    RH2M               → humidity
    WS2M               → wind speed
    PRECTOTCORR        → rainfall
    GWETTOP            → surface soil wetness (0–1 fraction of saturation)
    GWETROOT           → root zone wetness  (0–1 fraction of saturation)

FAO-56 Penman-Monteith
    → ET₀  (reference evapotranspiration, mm/day)

Irrigation decision
    deficit = ET₀ − rainfall
    CRITICAL  (>6 mm):  irrigate today
    HIGH      (>3 mm):  irrigate within 24 h
    MEDIUM    (>1 mm):  monitor
    LOW       (≤1 mm):  no action needed

Root-zone cross-check (PR #12)
    if GWETROOT ≥ 0.5 AND deficit > 4 mm → downgrade to LOW
    Show both figures; ask farmer to check 15 cm down

Fungal risk (PR #13 — dew-point model)
    dew_point = Magnus-Tetens(T_mean, RH_mean)   [Alduchov-Eskridge coefficients]
    wet_night  = (T_min − dew_point) ≤ 2°C       [2°C = radiative leaf cooling]
    risk if   ≥ 2 wet nights in 5-day forecast
          AND 18°C ≤ T_mean ≤ 32°C               [blast & blight sporulation band]
    Replaced old humidity ≥ 85% test — high humidity ≠ wet leaf

Unit tests:
    backend/tests/unit/et0.test.ts
    backend/tests/unit/dew-point.test.ts
    backend/tests/unit/advisory-rules.test.ts
    backend/tests/unit/irrigation-cross-check.test.ts
```

---

## 4. Crop Disease Scanner

```
Photograph (mobile)
    │   multipart/form-data
    │   web: Blob read from uri; RN: {uri} descriptor
    ▼
Vegetation check (colour histogram)
    │   calibrated colours: vegetation.test.ts
    │   reject if no warm-green pixels → "Please photograph a plant"
    ▼
plant-gate.service.ts  ← NOT YET WIRED
    │   Second MobileNetV2 model; refuses on positive non-plant evidence
    │   Weights not committed; file header says where to fetch
    ▼
ONNX ResNet classifier
    │   86 conditions · 19 crops
    │   ~43 MB weights · ~120 MB RSS · ~1 sec per image
    │   In-process — same service, no second container, no API fee
    ▼
{disease, confidence, top3, recommendations}
```

---

## 5. Security Model

```
App bundle  (extractable from APK — only public values go here)
    EXPO_PUBLIC_SUPABASE_URL
    EXPO_PUBLIC_SUPABASE_ANON_KEY    ← anon key, RLS is in place
    EXPO_PUBLIC_MAPBOX_TOKEN         ← pk.* public Mapbox token

Backend only  (never in bundle)
    SUPABASE_SERVICE_ROLE_KEY        ← bypasses RLS
    OPENWEATHER_API_KEY
    AGMARKNET_API_KEY
    FIRMS_MAP_KEY
    TOTP_ENCRYPTION_KEY              ← AES-256-CBC, TOTP secrets at rest

Auth flow
    App → Supabase Auth → JWT (ES256 via JWKS, or HS256 legacy)
    JWT → Express Authorization header
    Middleware → JWKS verify → req.farmerId
    Service layer → ownership.ts checks caller owns every touched row

RLS = second line of defence, not the first.
Ownership check is explicit in service layer, not delegated to RLS.
```

---

## 6. Maps — Mapbox (replaced Google Maps)

Google Maps watermarks every tile "for development purposes only" until a
billing account is attached. Mapbox provides satellite imagery on the free
tier with no card required.

| Token | Prefix | Ships in app | When used |
|---|---|---|---|
| `EXPO_PUBLIC_MAPBOX_TOKEN` | `pk.*` | ✅ Yes (public) | Runtime tile requests |
| `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` | `sk.*` | ❌ No (build-time secret) | Download native SDK at build |

Field area = Haversine on polygon vertices with `cos(latitude)` correction for
longitude narrowing. Displayed on the field card; used to contextualise NDVI readings.

---

## 7. Offline Behaviour

| Layer | Mechanism |
|---|---|
| Connectivity detection | `shared/network/ConnectivityProvider` (NetInfo) |
| User feedback | `NetworkBanner` — red strip on offline |
| Queued writes | `shared/offline/mutationQueue` |
| Sync on reconnect | `shared/offline/useSyncOnReconnect` |
| Mandi prices | Bundled in-app — always available, no network call |
| Sahayak (LLM) | Fully on-device — no network call per query |
| React Query stale times | Weather 30 min · Soil 24 h · NDVI 6 h · Fires 30 min |

---

## 8. Deployment

| What | Platform | Config |
|---|---|---|
| Expo app | EAS + Play Store | `eas.json` build profiles |
| Express API | Render | `render.yaml` blueprint; `npm run start:api` |
| Database | Supabase cloud | `supabase/migrations/` only; `npm run db:push` |

**Render notes:**
- Free-tier instance sleeps → cron jobs need a manual trigger: `npm run sync:ndvi`
- No IPv6 route out → all outbound agents use `https.Agent({ family: 4 })`
- `/health` reports last outcome of every external service (OWM, NASA, FIRMS, STAC)

---

## 9. Known Limits

| Limit | Detail |
|---|---|
| NDVI spatial resolution | 10 m — reliable mean + trend; not per-square-metre stress mapping |
| NDVI temporal lag | Sentinel-2 passes every ~5 days; NASA POWER lags 2-3 days |
| Scanner coverage | 86 labels on 19 crops; no "healthy" class — vegetation gate handles non-crops |
| Mandi data | State median; individual mandi quotes need a higher Agmarknet tier |
| Fire alerts | 24 h FIRMS archive; sub-hour resolution needs VIIRS active stream |
| Sahayak | On-device Gemma; correct for field advice; lower ceiling than cloud LLMs |
