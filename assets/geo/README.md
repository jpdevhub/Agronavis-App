# Boundaries

`india-states.json` — the 36 states and union territories of India.

| | |
| --- | --- |
| Source | Survey of India, via [india-geodata](https://github.com/yashveeeeeeer/india-geodata) (`SOI_States.parquet`) |
| Licence | **CC BY 4.0** — commercial use permitted, attribution required |
| Attribution | Carried in the app's legal pages; do not remove it |

Survey of India's own boundaries, so Jammu & Kashmir, Ladakh and Arunachal
Pradesh are drawn as India defines them. A map published in India has to be,
under the 2021 geospatial guidelines, and most community GeoJSON is not.

Simplified to roughly 3.5 km (Douglas–Peucker, topology preserved): 10 MB of
source survey geometry down to 200 KB, which is more than a phone can resolve
anyway. The four `DISPUTED (state v state)` polygons in the source are
inter-state claims rather than places a farmer picks, so they are dropped.

Names are plain ASCII to match `farms.state` and `market_prices.state` —
the survey writes Bihār and Chhattīsgarh, and spells it "Jammu and Kashmir"
where the crop catalogue uses "&".

## Replacing this file

Rings must be wound the way d3 reads a sphere: exterior counter-clockwise,
holes clockwise. Wound the other way, d3 reads each state as the whole globe
minus that state — the file parses, draws and fits, and India collapses to a
speck in the middle of the screen. `features/recommend/__tests__/india-map.test.ts`
checks the spherical area (~0.08 steradians) and fails on a file that is wrong.

To rewind one: reverse any ring whose standalone `geoArea` exceeds 2π.

Stored as `.json` rather than `.geojson` because Metro resolves the former
without extra configuration. It is required lazily by the map so the rest of
the app does not pay to parse it.
