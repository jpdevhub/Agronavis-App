# Releasing

App: [`com.agronavis.app`](https://play.google.com/store/apps/details?id=com.agronavis.app)
· API deploys from `main` automatically · the app does not.

**The server moves, the handsets don't.** Keep that in mind throughout.

## 1. The branch already exists

Work lives on `release/v1.0.1` from the day it opens. First commit sets
`VERSION` in `app.config.js` and opens the changelog section. By release time
there's nothing to prepare.

## 2. Merge the release PR

One PR, one review, both checks green.

## 3. Check the API actually came up

```bash
curl -s https://agronavis-api.onrender.com/health
```

`commit` must match your merge. A green build is not proof it booted — one
passed, deployed, and crash-looped.

**Migration?** Apply it *before* the API that needs it. Adding a column is
safe; renaming one is not. `npm run db:push`, then verify the table exists.

## 4. Build

```bash
npx eas build -p android --profile production-apk   # test this one
npx eas build -p android --profile production       # ship this one
```

Install the APK and use it. Tests don't catch a button under the gesture bar.
Note the `versionCode` → changelog.

## 5. Submit

```bash
npx eas submit -p android --profile production
```

Goes to **internal track, draft**. Promote from the Play Console manually.

Changed what data you collect, or added a permission? Update the data safety
form first — [release/PLAY-DATA-SAFETY.md](release/PLAY-DATA-SAFETY.md).

## 6. Tag

```bash
git tag -a v1.0.1 -m "1.0.1 — build 13" && git push origin v1.0.1
```

## Hotfix

Same path, smaller. `release/v1.0.2` from `main`, fix one thing, ship.

**No OTA.** `expo-updates` isn't installed — every fix costs a store round
trip. Worth adding before the user base makes that expensive.

## Credentials

| | |
| --- | --- |
| Keystore | EAS `karolix07`, creds `lyYn68oBwi`. **Lose it and this listing can never be updated.** |
| Prod env | EAS environment `production`, not `.env` |
| API secrets | Render |

**FCM is not configured** — no push reaches any device until a Firebase
project exists for `com.agronavis.app`. Alerts still show inside the app.
