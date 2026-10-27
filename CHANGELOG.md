# Changelog

Every released version, newest first. Version numbers match the Play Store
release they shipped in; the build number beside each is the Android
`versionCode`.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Which bump a change earns is set out in
[CONTRIBUTING.md](CONTRIBUTING.md#versions).

Each release is built on a branch named after it — `v1.0.1` — and every commit
that changes something a farmer would notice adds its own line here as it
happens, rather than being reconstructed from commit subjects at the end.

## [1.0.1] — unreleased

Nothing a farmer would notice yet. The work so far is documentation and
release process: see `CONTRIBUTING.md` and `docs/RELEASING.md`.

## [1.0.0] — 2026-10-27 · build 12

**The first public release**, live on Google Play as
[`com.agronavis.app`](https://play.google.com/store/apps/details?id=com.agronavis.app).

Everything below this line shipped in it: a farmer maps a field, and the app
reads the soil under it, the weather over it, what is growing on it and what
is burning upwind of it — then says what to do, in words that admit what they
do not know.

### Added

- **Stubble fire watch.** NASA FIRMS detections within 150 km of a field, with
  the wind direction that decides whether their smoke is coming your way.
  Adjacent satellite pixels are merged so one burning field appears once, and
  only fires from the last two days count toward a warning — today's wind says
  nothing about a fire that went out in May.
- **Crop vigour from orbit.** Sentinel-2 NDVI per field, measured nightly and
  kept, so the app shows the change between passes rather than a number whose
  meaning depends on the crop's stage. Cloud and snow are masked per pixel: a
  Himalayan field read −0.025 before masking and 0.769 after, which is the
  difference between bare rock and a dense canopy.
- **Root zone water,** with the fungal risk that comes with it. The same humid
  air that fills the soil is what leaves the canopy wet at dawn, so both sit on
  one screen.
- **A five-day forecast** on the weather record, from OpenWeatherMap. NASA
  POWER cannot do this — it publishes observed days and runs two behind.
- **Account deletion** from inside the app, removing the farm, the fields and
  every scan.
- **Two-factor authentication enforced by the server.** It was a prompt before:
  the screen appeared and the API answered anyway.
- Second model on the leaf scanner. MobileNetV2 now runs after the colour check
  and refuses a photograph only on positive evidence that it is something a
  crop cannot be — never on failing to recognise a leaf.
- **Reporting and blocking in the community.** Every post and comment has a
  menu to report it, with six reasons in plain words, and to block whoever
  wrote it. Blocking runs both ways and is enforced in the database query, not
  in the app — a one-way block would leave the harasser still able to read and
  reply, and filtering on the phone would leave the blocked farmer's words in
  the payload. Blocks are listed under Profile, where they can be lifted.
- **Alerts you choose.** The onboarding step now offers the three kinds of
  advisory the app actually produces, and the choice is enforced by the server
  before it pushes. Muting one stops the notification but still records the
  alert, because "do not buzz my phone" is not "never tell me".
- **A greeting that does not depend on push.** The app welcomes a farmer on
  their first visit and after three days away, written to the alerts list
  whether or not a notification could be delivered.
- **Mandi rates inside Sahayak**, fetched only when a price is asked about, and
  quoted in both ₹/quintal and ₹/kg. The assistant is told to quote nothing
  else and to decline when it has no rate — a farmer who carts a crop to market
  on an invented price has lost a day and the cartage.
- `LICENSE`, `SECURITY.md`, `PRIVACY.md` and this changelog.

### Changed

- Field mapping draws on Mapbox satellite imagery instead of Google Maps.
  Google watermarks every tile "for development purposes only" until a billing
  account is attached to the Cloud project; Mapbox serves satellite on a free
  tier with no card. **Requires two new tokens** — see `.env.example`.
- The reference library lists 19 crops rather than 21. The training set names
  two crops twice, which reached the farmer as Grape beside Grapes and Bell
  Pepper beside Pepper.
- Architecture documentation moved to `docs/architecture/` and rewritten as a
  technical reference.

### Removed

- The Socket.IO server. Nothing ever connected to it; notifications are
  delivered by Expo push.
- `expo-linear-gradient`, `expo-status-bar` and `socket.io-client` — no code
  imported any of them.
- The hackathon presentation and video script.

### Fixed

- The fire watch told farmers their fields were clear when the request had
  failed. A missing key, a rejected key and a network timeout all returned an
  empty list, and an empty list was drawn as good news.
- Fires, weather and advisories followed the farm's single pin rather than the
  field on screen, so a farmer standing in Assam was shown what was burning
  around Punjab.
- The model download counted as finished at 1.5 GB of a 3.66 GB file, and the
  runtime then failed on the truncated model with an error that read as an
  incompatible build.
- The app's cache lived only in memory, so opening it the next morning meant
  ten to fifteen seconds of empty screens while a sleeping API woke up.
- The Google Maps key was set as `android.googleMapsApiKey`, which Expo does
  not read, so every standalone build shipped with no key in its manifest.
  Superseded by the Mapbox migration but fixed first.

---

The versions below were internal builds, made while the app was being written
and never published to anyone. They are kept because they record how it got
here, not because anybody could install them.

## [1.2.0] — 2026-10-08 · build 14

### Added

- **Crop disease scanner.** Photograph a leaf and get an identification in
  about a second. 86 conditions, running on our own server rather than a paid
  vision API.
- A vegetation check that refuses photographs which do not show a crop, instead
  of forcing every image into one of the 86 labels.
- The reference library, seeded from the model's own classes.

### Fixed

- Scanning from a browser returned "could not read this photo" every time. Two
  separate causes: the file was sent as a text field rather than a file, and
  the request's content type made the upload serialise to JSON.
- Opening a scan result in a browser failed with HTTP 431. The photograph was
  being passed through the URL.
- The scanner identified a photograph of a person as healthy rice at 78%
  confidence. The vegetation check counted any warm-coloured pixel as plant
  tissue, which is also a description of human skin.
- The app's version had been left at 1.1.5 while the package moved to 1.2.0, so
  two different builds would have reported the same version.

## [1.1.5] — 2026-10-07 · build 14

### Added

- Mandi prices for 23 states, pooled to a state median with the range and the
  reporting mandis shown beneath each commodity.
- A full technical weather record behind the irrigation advice.

### Changed

- Weather and soil readings are scoped to each field rather than the farm, so
  two plots far apart no longer report identical conditions.
- Soil nitrogen, phosphorus and potassium now cover 712 districts across 32
  states, up from five states.

### Fixed

- Sahayak would freeze after its first answer, and the composer sat under the
  keyboard.

---

[unreleased]: https://github.com/jpdevhub/Agronavis-App/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/jpdevhub/Agronavis-App/releases/tag/v1.2.0
[1.1.5]: https://github.com/jpdevhub/Agronavis-App/releases/tag/v1.1.5
