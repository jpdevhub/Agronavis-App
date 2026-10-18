# Building satellite field monitoring

A walkthrough of the three phases behind Agronavis' crop health feature, in
enough detail to build it again from nothing. Every command here runs as
written — no key, no account.

For what the finished system *is*, see
[architecture/SATELLITE.md](../architecture/SATELLITE.md). This file is how it
was made, including the four things that went wrong.

---

## The idea in one paragraph

A satellite photographs every field on Earth every five days in thirteen
colours, four of which the eye cannot see. Healthy leaves reflect near-infrared
hard and absorb red to photosynthesise, so comparing those two bands measures
living plant tissue. That data is free. The work is getting at it without
downloading hundreds of megabytes per field.

---

## Phase A — when did a satellite last look?

**Goal:** tell the farmer the date of the last pass that actually saw the
ground, and when the next is due.

### Step 1 — find the scenes

Sentinel-2 scenes are catalogued by a STAC API. Run this; it needs nothing:

```bash
curl -s -X POST "https://earth-search.aws.element84.com/v1/search" \
  -H "Content-Type: application/json" \
  -d '{
    "collections": ["sentinel-2-l2a"],
    "bbox": [88.35, 22.74, 88.39, 22.78],
    "datetime": "2026-09-16T00:00:00Z/2026-10-16T23:59:59Z",
    "limit": 5
  }'
```

You get back scenes with a date and `eo:cloud_cover`:

```
2026-10-15   cloud  3.0%
2026-10-10   cloud 32.8%
2026-10-05   cloud 19.0%
2026-09-30   cloud 73.4%
```

### Step 2 — the one idea in Phase A

**The most recent pass is not the most recent *useful* pass.** On 15 October
at 3% cloud you can see the field. At 73% you are looking at weather. So
filter on cloud, and report the newest scene that survives the filter.

That single distinction is the whole phase. It needs no pixels and no account.

### Step 3 — say it honestly

Three different states, three different sentences:

| Situation | What to say |
|---|---|
| Recent clear pass | `Clear view 15 Oct · 3% cloud` |
| Passes happened, all cloudy | `Clouded out since 15 Oct · next pass 20 Oct` |
| Catalogue unreachable | Say nothing confident — **never** "no satellite has been over" |

The third matters most and is the easiest to get wrong. See *The rule* below.

### ⚠ Trap 1 — Copernicus is not the only door

The ESA's own portal (`dataspace.copernicus.eu`) catalogues the same scenes,
but its pixel assets are `s3://eodata/...` URIs needing credentials, and
registration can be closed. Element 84's Earth Search carries identical data
on public AWS. Queried for the same field on the same day, both returned the
same scene with the same cloud figure.

---

## Phase C — what is actually growing

Built before Phase B, because the picture is drawn from the numbers.

### Step 1 — the formula

```
NDVI = (NIR − red) / (NIR + red)
```

In Sentinel-2 terms, `B08` and `B04`. Both are assets on every scene:

```bash
curl -s -X POST "https://earth-search.aws.element84.com/v1/search" \
  -H "Content-Type: application/json" \
  -d '{"collections":["sentinel-2-l2a"],"bbox":[88.35,22.74,88.39,22.78],"limit":1}' \
  | python3 -c "import sys,json; a=json.load(sys.stdin)['features'][0]['assets']; print(a['red']['href']); print(a['nir']['href'])"
```

| NDVI | Ground |
|---|---|
| < 0 | Not crop — water, snow, cloud |
| 0 – 0.2 | Bare soil |
| 0.2 – 0.4 | Sparse |
| 0.4 – 0.6 | Growing |
| > 0.6 | Dense canopy |

### Step 2 — the property that makes it affordable

A band is a 10980×10980 GeoTIFF, over 100 MB. A field is twenty pixels across.
**Check that the server answers range requests before building anything:**

```bash
curl -s -o /dev/null -w "%{http_code} %{content_type}\n" -r 0-1023 "<the B04 href>"
```

```
206 image/tiff; application=geotiff; profile=cloud-optimized
```

`206 Partial Content` is the whole feature. It means you can pull the few
kilobytes over one field and leave the rest. Without it you need a paid
processing API.

### Step 3 — read the window

`geotiff` speaks range requests natively:

```ts
const { fromUrl } = require('geotiff');

const tiff  = await fromUrl(redHref);
const image = await tiff.getImage();
const [ox, oy] = image.getOrigin();      // top-left, in the scene's CRS
const [rx, ry] = image.getResolution();  // metres per pixel

const left = Math.round((x - HALF_M - ox) / rx);
const top  = Math.round((y + HALF_M - oy) / ry);
const side = Math.round((HALF_M * 2) / Math.abs(rx));

const raster = await image.readRasters({ window: [left, top, left + side, top + side] });
```

### ⚠ Trap 2 — the scene is not in latitude and longitude

Sentinel-2 tiles are projected in **UTM**, and *each tile carries its own
EPSG*, reported per scene as `proj:epsg`. Convert before computing offsets:

```ts
const [x, y] = proj4('EPSG:4326', `EPSG:${scene.epsg}`, [lon, lat]);
```

Hard-coding one zone puts your sample in a different country. Read it per
scene.

### ⚠ Trap 3 — scene cloud cover tells you nothing about *your* field

This one produced visibly wrong data before it was caught. The first run
without per-pixel masking gave:

```
field 2:  0.352 → 0.563   +60%  ⎫ ten days apart,
field 5:  0.598 → 0.370   −38%  ⎭ neighbouring fields
field 6: -0.025                   below zero
```

No crop moves 60% in ten days, and nothing physical reads below zero. A scene
can be 3% cloud overall with the one cloud sitting on your field.

The fix is the `SCL` band — a per-pixel scene classification shipped with
every L2A scene:

| Keep | Drop |
|---|---|
| 4 vegetation, 5 bare ground, 7 unclassified | 0 nodata, 1 saturated, 2 shadow, 3 cloud shadow, 6 water, 8–9 cloud, 10 cirrus, 11 snow |

Re-measured with masking, that below-zero field:

```
before   −0.025   400/400 averaged, snow included
after    +0.769   240/400 usable — a dense canopy
```

Not slightly wrong. The wrong surface entirely. Also discard the pass if too
few pixels survive — under 40%, the average describes the weather.

`SCL` is 20 m where the bands are 10 m, so scale the index rather than
assuming they line up.

### ⚠ Trap 4 — this is far too slow for a request

Profile before you design. Cold, against a real scene:

| Step | Time |
|---|---|
| `fromUrl` — fetch header | 5.7 s |
| `getImage` — parse the file index | **24.0 s** |
| `readRasters` — one 1024² tile | 12.1 s |

~42 s *per band*. With masking that is three bands, two passes — several
minutes per field. Almost none of it is pixels; it is parsing the index of a
very large file.

**So it is a nightly job that stores, and the API reads one row.** This turns
out better than the original plan: stored readings accumulate into a
season-long curve, and a single NDVI means little — 0.4 is excellent for a
seedling and alarming for a canopy near harvest. Lead with the *change*
between passes.

### Step 4 — make re-runs repair themselves

An algorithm will improve, and old rows need re-measuring. Mark what is
trustworthy — here, rows with a stored grid were masked, rows without are from
before — and have the job re-measure the rest.

One more turn of this: if a re-measure is *skipped* (the new pass was all
cloud) the old bad row survives untouched. So the read path serves only
trustworthy rows, and the job deletes the rest once it has looked at the field.

---

## Phase B — drawing it

**Goal:** the field coloured brown-to-green, over the satellite view.

### Step 1 — keep the pixels, not just the mean

A 20×20 grid is 400 numbers, a couple of kilobytes as JSON. Store it beside
the average and the picture costs nothing later. Recomputing from AWS would be
another 40 seconds to recover numbers you already had.

### Step 2 — colour and encode

Anchor the colour ramp at values that mean something agronomically, not evenly
across the range — most of the interest is between 0.15 (bare) and 0.6
(canopy). Encode with `pngjs`, one image pixel per reading.

Make nodata **transparent**, so the imagery shows through rather than a black
square reading as a dead patch.

### ⚠ Trap 5 — a map cannot authenticate

A map's image loader sends none of your auth headers. A protected URL fails to
load; an unprotected one publishes a farmer's field to anyone with the link.

Send the PNG **inline as a `data:` URI** in the JSON response the app has
already authenticated for. About a kilobyte. No bucket, no expiry policy, no
leak.

### Step 3 — place it

```tsx
<ImageSource id="ndvi" url={heatmapDataUri} coordinates={bounds}>
  <RasterLayer id="ndvi-layer" sourceID="ndvi"
    style={{ rasterOpacity: 0.78, rasterResampling: 'nearest' }} />
</ImageSource>
```

`coordinates` is four `[lon, lat]` corners: top-left, top-right, bottom-right,
bottom-left. A degree of latitude is ~111 km everywhere; longitude narrows
with `cos(latitude)` — which matters by the time you reach a Himalayan field.

**`rasterResampling: 'nearest'` is deliberate.** Keep it blocky. At 10 m a
one-acre field is about six blocks across, and smoothing implies precision the
instrument does not have.

---

## The rule all three phases follow

Learned from a fire-detection bug that told farmers their fields were clear
when the request had failed:

> **A source that cannot be reached must never render as good news.**

Five states, kept distinct, each asserted in tests:

| State | Means |
|---|---|
| `loading` | Still asking |
| `no-field` | Nothing mapped to ask about |
| `unavailable` | Asked, got no answer — never an all-clear |
| `no-data` | Answered; no clear pass yet |
| `ready` | A real reading |

`no-data` and `unavailable` look alike and are not. One means the satellite
has not had a clear look; the other means we could not find out. Collapsing
them is how an outage becomes a reassurance.

---

## Platform notes

**`require`, not `import`, for geotiff.** It publishes ESM and CommonJS. A
CommonJS build rewrites `await import()` into `require()` of an ESM entry
point — which works under `tsx` locally and fails in production. Verify
against the build that will actually run.

**Pin IPv4 on outbound calls.** Some hosts have no IPv6 route out and Node
spends its attempt on the dead half:

```
connect ETIMEDOUT 198.118.194.34:443;
connect ENETUNREACH 2001:4d0:241a:40c0::34:443 - Local (:::0)
```

```ts
new https.Agent({ family: 4, keepAlive: true })
```

**A sleeping instance fires no cron.** On a free tier, give every job a manual
runner (`npm run sync:ndvi`) — it is how the first readings ever get taken.

**Report upstream health somewhere reachable.** A feature that fails only on
the server, while working from your laptop, is indistinguishable from a broken
feature. `/health` carries the last outcome of each external call for exactly
this reason.

---

## What this cannot do

At 10 m a one-acre field is roughly forty pixels. That is enough for a
reliable mean and a trend between passes. It is **not** enough to say which
corner of a field is struggling, however much a per-square-metre stress map
would sell. Sub-metre imagery exists and is not free.

Say what the instrument supports.
