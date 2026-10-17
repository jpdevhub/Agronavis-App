# Watching a field from orbit

How Agronavis sees a farmer's land without owning a satellite, a licence, or a
credential — and what each of the three phases actually does.

---

## Why this exists

A farmer can see their own field better than any satellite. What they cannot
see is the field as it was ten days ago, or the half of it they do not walk
past daily, or the difference between a crop that is merely dusty and one that
has started to thin. Those are differences of a few percent in reflected
light, which is exactly what a multispectral sensor is for.

Two instruments do the work, both public, both free:

| | Sentinel-2 | Mapbox Satellite |
|---|---|---|
| Owner | European Space Agency | Commercial mosaic |
| Resolution | 10 m | ~0.5 m |
| Dated | Yes, per pass | **No** |
| Revisit | ~5 days | Never — one static image |
| Spectral bands | 13, including near-infrared | Red, green, blue |

The distinction in the last three rows is the whole design. **Mapbox is the
canvas; Sentinel-2 is the sensor.** The beautiful imagery under the field
boundary was stitched years ago in places and does not change from one week to
the next — it can show you *where* your field is, never *how* it is. Anything
that claims to monitor has to come from the dated instrument, even though it
is twenty times coarser.

---

## Where the data comes from

Sentinel-2 scenes are published two ways. Both carry identical data; they
differ only in how you get in.

**Copernicus Data Space** is the ESA's own. Its catalogue is open, but every
pixel asset is an `s3://eodata/...` URI needing credentials, and registration
was closed when this was built.

**Earth Search**, run by Element 84, catalogues the same scenes on AWS and
serves them as public cloud-optimised GeoTIFFs over plain HTTPS. Queried for
the same field on the same day, both returned the same scene — 15 October
2026, 3% cloud. So Agronavis uses the one that opens.

No account, no key, no quota. Of every external source in this app, this is
the only one that needs nothing at all.

### The property that makes it affordable

A single Sentinel-2 band is a 10980×10980 GeoTIFF — over a hundred megabytes.
One farmer's field is twenty pixels across.

Cloud-optimised GeoTIFFs answer **HTTP range requests**, so the few kilobytes
covering one field can be fetched out of the middle of the file and nothing
else. Verified before any of this was written:

```
B04.tif (red)  →  HTTP 206  image/tiff; profile=cloud-optimized
B08.tif (NIR)  →  HTTP 206  image/tiff; profile=cloud-optimized
```

Without the 206 this feature would need a hosted processing API and a bill.

---

## Phase A — when the satellite last looked

**`GET /satellite/field/:fieldId`** · `satellite.service.ts`

The catalogue is queried for passes over the field's centre in the last 30
days. Each comes back with a date and a scene-level cloud figure.

```
2026-10-15   cloud  3.0%   ← clear
2026-10-10   cloud 32.8%
2026-10-05   cloud 19.0%   ← clear
2026-09-30   cloud 73.4%
```

Above 20% cloud the ground is mostly hidden, so the service reports the most
recent pass that **actually saw something**, which is not always the most
recent pass. The dashboard reads `Clear view 15 Oct · 3% cloud`, and the live
dot only lights when that was within about two revisits.

When every recent pass was clouded out it says so and names the next expected
pass. That matters: a farmer should know the difference between *nothing has
changed* and *nobody could see*.

This phase needs no credentials and no stored state. It is metadata only — no
pixel is read.

---

## Phase B — drawing what it saw

**`heatmap.ts`** · rendered into the Phase C response

The per-pixel NDVI values are coloured brown→yellow→green and encoded as a
small PNG, laid over the field with a Mapbox `ImageSource` pinned to four
corners.

Three decisions worth recording:

**It is sent inline as a `data:` URI, not hosted.** A map's image loader
carries none of our auth headers, so a protected URL would simply fail to
load, and an unprotected one would publish a farmer's field to anyone with the
link. The grid is four hundred numbers; the PNG is around a kilobyte. It rides
along in a response the app has already authenticated for.

**It is rendered from stored numbers, not from the scene.** Going back to AWS
would cost forty seconds to recover values already computed once.

**It is deliberately blocky.** `rasterResampling: 'nearest'`, one block per
10 m of ground. A smoothed image would imply detail the instrument does not
have — a one-acre field is about six blocks across. Honest pixelation beats a
convincing lie.

Nodata is transparent rather than black, so the satellite image shows through
instead of a dark square implying a dead patch.

---

## Phase C — reading the crop

**`GET /satellite/ndvi/field/:fieldId`** · `ndvi.service.ts`, `ndvi.job.ts`

### The measurement

A healthy leaf reflects near-infrared hard and absorbs red to photosynthesise.
The gap between those two bands tracks living tissue:

```
NDVI = (NIR − red) / (NIR + red)
     = (B08 − B04) / (B08 + B04)
```

| NDVI | Ground |
|---|---|
| < 0 | Not crop — water, snow or cloud |
| 0 – 0.2 | Bare soil |
| 0.2 – 0.4 | Sparse |
| 0.4 – 0.6 | Growing |
| > 0.6 | Dense canopy |

A 200 m box around the field centre gives a 20×20 grid at 10 m. Pixels reading
zero in both bands are nodata and skipped — not counted as nothing growing.

### Cloud masking, and why it is not optional

Filtering whole scenes on cloud cover says nothing about whether cloud sat
over *this* field. The first run without per-pixel masking produced swings of
**+60% and −38% across ten days** on neighbouring fields, which no crop does,
and a Himalayan field that read **−0.025** — below zero, which no plant and no
soil can be.

Sentinel-2 L2A ships a per-pixel scene classification (`SCL`, 20 m) beside the
bands. Only vegetation (4), bare ground (5) and unclassified (7) describe
ground worth measuring. Cloud at either probability (8, 9), thin cirrus (10),
cloud shadow (3), topographic shadow (2), water (6), snow (11), saturated (1)
and nodata (0) are masked out.

That Himalayan field, re-measured:

```
before   −0.025   400/400 pixels averaged, snow included
after     0.769   240/400 usable — a dense canopy
```

The reading was not slightly off. It was the wrong surface entirely.

If fewer than 40% of pixels survive the mask, the pass is **discarded rather
than stored**: its average would describe the weather, not the field. The
classification layer is 20 m against the bands' 10 m, so its index is scaled
rather than assumed to line up.

A reading stored without a grid predates this masking, and the job re-measures
those instead of skipping them — a re-run repairs the record with no manual
deletion.

Scenes are projected in UTM, and **each Sentinel-2 tile carries its own EPSG**,
reported per scene by the catalogue. Latitude and longitude are converted into
that zone's metres before becoming pixel offsets; assuming a single projection
would place the sample in the wrong country.

### Why it is a job and not an endpoint

Profiled against a real scene:

| Step | Cold |
|---|---|
| `fromUrl` — fetch header | 5.7 s |
| `getImage` — parse the file index | **24.0 s** |
| `readRasters` — one 1024² tile | 12.1 s |

About 42 s per band. Two bands across two passes came to **168 seconds**, and
almost none of it is the pixels — it is parsing the index of a very large file.
No screen can wait for that.

So `ndvi.job.ts` measures nightly and stores; the API answers from one row.
This turned out better than the original plan: stored readings accumulate into
a **season-long curve**, which is what NDVI actually needs. A single value
means little — 0.4 is excellent for a seedling and alarming for a canopy near
harvest — so the app leads with the change between passes and only calls a
fall of 10% or more worth walking the field for.

Readings are unique per `(field_id, captured_on)`, so the job is free to
re-run and skips passes it has already measured.

### Real output

```
2026-10-12   NDVI 0.678   dense canopy
2026-10-05   NDVI 0.442   growing
2026-10-15   NDVI 0.409   growing
```

---

## Operational notes

**`npm run sync:ndvi`** runs the job by hand. The cron is nightly, but
`render.yaml` already records why that is not enough on the free tier: *a
sleeping instance fires no cron*. The same applies to `sync:fires`.

**Caps.** Eight fields per run, two passes each — at ~40 s per band that is
already several minutes.

**geotiff is `require`d, not `import`ed.** It publishes both ESM and CommonJS;
this backend compiles to CommonJS, where TypeScript rewrites `await import()`
into `require()` of an ESM entry point. That works under `tsx` locally and
fails on Render. The CommonJS build was verified directly.

**IPv4 is pinned** on every outbound call here, as it is for FIRMS. Render has
no IPv6 route out, and Node spends its attempt on the dead half first.

---

## The rule all of this follows

Established by a fire-detection bug that told farmers their fields were clear
when the request had failed:

> A source that cannot be reached must never render as good news.

Every state in this feature is separated accordingly, and asserted in
`features/insight/__tests__/cardState.test.ts`:

| State | Means |
|---|---|
| `loading` | Still asking |
| `no-field` | Nothing mapped to ask about |
| `unavailable` | Asked, got no answer — never dressed as an all-clear |
| `no-data` | Answered; no pass measured yet, or all were clouded out |
| `ready` | A real reading |

`no-data` and `unavailable` look similar and are not: one means the satellite
has not yet had a clear look, the other means we could not find out.

---

## What is deliberately not here

**Within-field stress maps.** At 10 m a one-acre field is ~40 pixels. Enough
for a reliable mean and a trend; not enough to tell a farmer which corner is
struggling. Claiming otherwise would be a resolution the sensor cannot support.

**NDMI (water stress).** `(NIR − SWIR) / (NIR + SWIR)` from B08 and B11, both
public in the same scenes. One more band read; not yet built.

**True-colour overlay.** The `visual` asset is already in every scene listing.
