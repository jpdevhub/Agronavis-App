# What Agronavis does for a farmer

Every capability in the app, what it gives the person standing in the field,
and the release it arrived in.

Everything here is in **1.0.0**, the first public release, live on Google Play
as [`com.agronavis.app`](https://play.google.com/store/apps/details?id=com.agronavis.app).
The pull request numbers record when each part was built, not when it shipped —
they all shipped together.

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
it and hear the answer.

It runs on the handset rather than on a server. That means it answers in a
field with one bar of signal, it costs nothing per question, and what you ask
about your own land is never sent anywhere.

Everything it knows up front comes from what the app has already stored, never
from a fresh request — which is why it opens instantly instead of showing a
blank screen while five things load.

### Today's prices, when you ask for them

Ask what a crop is making and Sahayak looks up the real mandi rates near your
district, once, at that moment. They are quoted in both units — **per quintal
and per kg**, because mandis publish one and farmers sell in the other.

This is the one thing it fetches, and it fetches it only when asked. The
reason is not speed but honesty: a model asked what wheat is selling for will
answer with a number whether or not it knows one, and a farmer who carts a
crop to market on an invented price has lost a day and the cartage. With the
real figures in front of it, it is told to quote nothing else and to say
plainly when it has no rate for the crop you asked about.

### Your conversation is yours

The thread stays for the working day, so going out to look at the field and
coming back does not lose it. It belongs to the account that had it — signing
out deletes it from the handset, and a second account on the same phone never
sees it. There is a **new chat** button when you would rather start clean.

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

**Sahayak answers in eight languages. The screens are in English, and the app
says so before you choose.**

Pick from English, Hindi, Bengali, Marathi, Punjabi, Gujarati, Telugu or
Kannada and Sahayak will answer in it, in its own script — and speak it aloud,
and listen in it. Reading comfortably is not a requirement for using the part
of the app you can talk to.

The rest of the screens are still English. That is stated plainly on the
language screen, under the list, rather than discovered afterwards: a farmer
who picks their own language and watches every screen stay in English decides
the app is broken, and they are closer to right than a label claiming support
would be.

A Hindi translation file exists and one screen reads it. The screens become
multilingual when they are genuinely translated, not when the picker says so.

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

---

## Know what is burning upwind

**Stubble fires near your field, and whether their smoke is coming your way.**

Satellites detect burning twice a day. Agronavis reads every detection within
150 km of your field and asks the question that actually matters: is the wind
carrying that smoke here? A fire upwind of you at twenty kilometres matters
more than one downwind at five.

Detections from a single burning field are merged, so one fire appears once
rather than as a scatter of hot pixels. Only recent fires count toward a
warning — today's wind says nothing about a fire that went out last season.

When the satellite data cannot be reached, the screen shows when it was last
updated instead of an empty list. An empty list drawn as good news is how an
app tells a farmer their field is clear when it has not looked.

> NASA FIRMS · VIIRS and MODIS · **#16**, **#17**, **#18**, **#19**

---

## Ask the farmers around you

**A feed for the questions an app cannot answer.**

Post a photograph and a question; other farmers answer. Prices, varieties, what
worked on soil like yours — the things that are local knowledge rather than
public data.

### And leave when you want to

Every post and every comment carries a menu that reports it, with six reasons
in plain words rather than a policy vocabulary, and blocks whoever wrote it.

A block runs **both ways**: their posts and comments disappear for you, and
yours for them. One-directional blocking would hide a harasser from the person
being harassed while leaving that person's writing open for the harasser to
read and answer — which is the half that matters least to the one who asked
for it.

The filtering happens in the database query, not on the phone. Hiding posts
after they arrive would leave the blocked farmer's words sitting in the data
the app downloaded, which is concealment rather than blocking.

Blocks are listed under **Profile → Blocked farmers**, where any of them can
be lifted. Nobody is told they have been blocked.

> **#20**

---

## Alerts, and only the ones you asked for

**The app tells you when something needs doing, not when something happened.**

Three kinds of alert, each a switch you set during onboarding and can change
later: **weather warnings**, **irrigation**, and **pest and disease**.

Muting one stops your phone buzzing but still records the alert, so it is
there in the list when you go looking. "Do not buzz my phone at night" is not
"never tell me".

Only urgent alerts reach the handset at all. The rest wait in the list, which
is why the list has to be worth opening.

The app welcomes you on your first visit, and again after three days away.
Both are written to the list whether or not a notification could be delivered
— the record a farmer can read must not depend on whether a push got through.

---

## Your account, and leaving

**Two-factor authentication, enforced by the server rather than the screen.**

Turning on two-factor authentication binds an authenticator app and stores
backup codes. The API checks it on every request, not just the login screen —
before this it was a prompt the app drew and the server ignored.

**Deletion means deletion.** Profile → Delete My Account removes the profile,
the farms and their boundaries, the scans and their photographs, the posts and
the alerts, and signs the handset out with the notification shade emptied. It
is also reachable from
[agronavis.in/delete-account](https://www.agronavis.in/delete-account) for
anyone who has already uninstalled the app.

Billing records are kept for seven years because Indian tax law requires it,
and encrypted backups catch up within ninety days. Both are stated on the page
rather than left to be discovered.
