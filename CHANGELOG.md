# Changelog

Every released version, newest first. Version numbers match the Play Store
release they shipped in; the build number beside each is the Android
`versionCode`.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Second model on the leaf scanner. MobileNetV2 now runs after the colour check
  and refuses a photograph only on positive evidence that it is something a
  crop cannot be — never on failing to recognise a leaf.
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

- The Google Maps key was set as `android.googleMapsApiKey`, which Expo does
  not read, so every standalone build shipped with no key in its manifest.
  Superseded by the Mapbox migration but fixed first.

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
