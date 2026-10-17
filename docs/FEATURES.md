# What Agronavis does for a farmer

Every capability in the app, what it gives the person standing in the field,
and the release it arrived in.

---

## Know your soil

**Nitrogen, phosphorus, potassium and nine more nutrients, for your district.**

India tests its soil district by district and publishes the results. Agronavis
reads the district your field sits in and shows what is actually there — not a
national average, and not a guess.

Each reading comes with the number of laboratory samples behind it, so you can
see how firm it is. Where a district has barely been tested, the app says so
rather than pretending.

Twelve parameters: nitrogen, phosphorus, potassium, organic carbon, pH,
salinity, sulphur, iron, zinc, copper, boron and manganese.

> 712 districts · 32 states · from the Government of India's Soil Health Card

---

## Know your weather, and what to do about it

**Today's conditions over your field, and the one line that matters: whether to
irrigate.**

Water loss is worked out with the United Nations' own equation — FAO-56
Penman-Monteith, the standard irrigation engineering uses — from NASA satellite
measurements of sunlight and rainfall over your exact coordinates.

The full daily record sits behind the advice, so the working can be checked
rather than taken on trust.

> NASA POWER · FAO-56 Penman-Monteith

### Irrigation advice that checks itself

**Shipped in [#12](https://github.com/jpdevhub/Agronavis-App/pull/12)**

A water balance is a calculation, and a calculation cannot see a canal turn, a
pump run, or a shower that fell between satellite passes. Left alone it will
tell you to water a field you irrigated yesterday.

So Agronavis reads NASA's measurement of the water actually in your root zone
and lets it argue. When the measurement contradicts the calculation, the app
shows you both figures and asks you to dig fifteen centimetres and judge for
yourself. When they agree, it says so — the same instruction is worth more when
two independent things point the same way.

> **#12** — added `GWETTOP` and `GWETROOT` to the existing NASA POWER request
> and surfaced both on `SolarDay` as nullable fields. `buildIrrigationAdvisory`
> takes the most recent root-zone reading and overrides its own thresholds when
> wetness at or above 0.5 of saturation contradicts a deficit over 4 mm,
> downgrading to severity `low` with both figures quoted. POWER lags two to
> three days, so every reading is rendered with its measurement date. Nulls are
> preserved rather than defaulted — a substituted value would be cross-checked
> as though it had been measured. No key, no migration, two extra parameters on
> a call already being made.

---

## Know when disease is coming

**A warning before the lesions appear, not after.**

### Fungal risk from the dew point

**Shipped in [#13](https://github.com/jpdevhub/Agronavis-App/pull/13)**

A fungal spore landing on a leaf does nothing until that leaf is wet for
several hours. So the question worth asking is not whether the air feels humid
— it is whether tomorrow's dawn will leave water sitting on your crop.

Agronavis works out the dew point for each of the next five days and checks
whether the night cools far enough to reach it, allowing for the fact that a
leaf under an open sky sits a degree or two colder than the air around it.

Two such nights in the forecast, in the temperature band blast and blight
actually grow in, and you are told to start scouting the lower leaves and keep
a preventive spray ready.

Humidity alone gets this wrong in both directions. A muggy afternoon that never
cools wets nothing. A clear night at moderate humidity wets every leaf in the
field.

> **#13** — replaced the `humidity >= 85%` test with a dew-point one. Dew point
> is computed per forecast day by Magnus-Tetens (Alduchov-Eskridge
> coefficients, ±0.1 °C from −40 to 50 °C) from the day's mean temperature and
> mean relative humidity, then a day counts as wet when
> `tempMin − dewPoint ≤ 2 °C`. Relative humidity is a ratio against a
> temperature-dependent ceiling and swings 50–95% across one day at constant
> absolute moisture; dew point does not move, which is why it is the
> thresholdable quantity. The 2 °C allowance is radiative cooling of the leaf
> surface below ambient. Sporulation band of 18–32 °C unchanged; two qualifying
> days in five trigger. Server-side only — no API, schema or credential change.

---

## Scan a leaf

**Photograph a spot on a leaf and get an answer in about a second.**

Eighty-six conditions across nineteen crops, from wheat rust to cotton aphids.
The reading comes with the two next most likely conditions beside it, so you can
weigh them against what you can see.

Two things it will not do. It will not answer a photograph that does not show a
crop — it asks for a better picture instead of guessing. And it never tells you
a dose: it asks you to confirm against the reference library before spraying,
because the wrong treatment costs more than the disease.

The model runs on our own servers. No per-photograph fee, and nothing is handed
to a third-party vision service.

---

## Know your price

**Today's rate for your state, with the range and the mandis behind it.**

A median across every mandi reporting in your state, shown with the lowest and
highest figures and which markets they came from. A median rather than an
average, so one unusual mandi cannot move the number you plan around.

Held locally, so the screen still works on the days the national source does
not.

> 11,332 price records · 1,491 mandis · 225 commodities · 23 states

---

## Ask Sahayak

**An assistant that already knows your farm — and runs on your phone.**

Sahayak knows your fields, your soil reading, your current weather and your
open advisories before you ask it anything. You can type, or you can speak to
it and hear the answer, in English or Hindi.

It runs on the handset rather than on a server. That means it answers in a
field with one bar of signal, it costs nothing per question, and what you ask
about your own land is never sent anywhere.

---

## Map your field once

**Everything else follows from the boundary you draw.**

Trace your field on satellite imagery and the app works out the acreage itself,
accounting for the curve of the earth. From that moment every answer — soil,
weather, water, crops, price — is about that field, not your district and not
your village.

Two plots three hundred kilometres apart read differently, because they are
different places.

> Mapbox satellite imagery

---

## Plan the season

**Pick a crop and the season lays itself out.**

The crop list is the one the government scheme recognises for your state, so
nothing offered is irrelevant to where you farm. Choosing one builds a dated
task list from sowing through to harvest.

> 1,812 crops across 31 states

---

## Your language, your voice

English and Hindi across the whole app, not only the assistant. Speak your
question and hear the answer, so reading comfortably is never a requirement for
using any part of it.

---

## See your crop from orbit

**How much is actually growing on your field, measured every few days from
space.**

A satellite passes over your land about every five days and photographs it in
light your eye cannot see. Healthy leaves reflect a great deal of infrared and
swallow red light to feed themselves, so the gap between those two tells you
how much living crop is standing there — before thinning is obvious from the
gate.

Agronavis reads that for your field and shows it three ways:

- **A number.** Bare soil sits near 0.15, a full healthy canopy past 0.6.
- **The direction.** More useful than the number: a drop of a tenth since the
  last pass means something has changed in the last few days, and the app says
  so plainly — *worth walking the field*.
- **A picture.** Your field coloured brown to green, one block per ten metres
  of ground, laid over the satellite view.

When cloud hides the ground the app tells you that too, and when the next
clear pass is due. It will never tell you the crop looks fine on a day nothing
could see it.

> Sentinel-2, European Space Agency · 10 m · free and open · no account needed
> **#20** — technical detail in [docs/architecture/SATELLITE.md](architecture/SATELLITE.md)
