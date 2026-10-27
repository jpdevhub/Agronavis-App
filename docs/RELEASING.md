# Releasing Agronavis

How a change on `main` becomes an app on a farmer's phone.

Agronavis is on Google Play as
[`com.agronavis.app`](https://play.google.com/store/apps/details?id=com.agronavis.app).
The API is on Render and deploys from `main` automatically; the app does not,
because an installed APK keeps running whatever it was built with until
someone updates it.

That asymmetry is the thing to keep in mind throughout: **the server moves and
the handsets do not.**

---

## Before anything else

Decide the version. `1.0.0 → 1.0.1` for fixes, `→ 1.1.0` for something new a
farmer can do. The table in [CONTRIBUTING.md](../CONTRIBUTING.md#versions)
has the full rule.

The version is decided **first**, because the branch is named after it and
every commit on that branch belongs to that release.

---

## 1. The release branch already exists

Work for a release is done on its own branch from the day it opens:

```bash
git checkout main && git pull
git checkout -b v1.0.1
```

Its first commit sets **`app.config.js` → `VERSION`** and opens the version's
section in **`CHANGELOG.md`**. The Android `versionCode` is not in this repo:
`eas.json` sets `appVersionSource: "remote"`, so EAS holds the counter and
increments it on every production build.

Everything for the release lands on that branch over however many commits it
takes. By the time you are releasing, there is nothing to prepare — the
changelog was written as the work happened, not reconstructed from it.

---

## 2. Open the release pull request

```bash
gh pr create --base main --title "1.0.1"
```

One pull request, one review, both checks green. A release gets the same
review as anything else; it is only larger.

---

## 3. Ship the API first, if it moved

Merging the release PR deploys the API, because Render tracks `main`. **Wait
for it**, then confirm what is actually running:

```bash
curl -s https://agronavis-api.onrender.com/health
```

```json
{ "status": "healthy", "version": "1.0.1", "commit": "abc1234" }
```

The `commit` must match the merge you just made. A green CI run is not proof
the service came up — that check exists because a build once passed, deployed,
and crash-looped on boot.

### If the release includes a migration

Apply it **before** the API that needs it deploys, and write it so the
previous API survives it. Adding a column is safe; renaming one is not.

```bash
npm run db:push        # or paste the file into the Supabase SQL editor
```

Every migration is idempotent, so re-running one is safe. Afterwards, check
the table is really there rather than assuming the push worked.

---

## 4. Build the artifacts

Two profiles, both carrying the production environment, channel and keystore —
they differ only in packaging:

```bash
# A testable build. Increments the version code, so each test build is
# distinguishable from every other.
npx eas build --platform android --profile production-apk

# The bundle that goes to Play.
npx eas build --platform android --profile production
```

Build the APK first, install it, and use the app. Tests do not catch a button
sitting under the gesture bar or a screen that comes back blank after a
task-switch.

Note the `versionCode` EAS reports and write it into the changelog entry.

### Check what is actually inside the bundle

Worth doing when a release carries something you cannot see in a diff:

```bash
unzip -q app.aab -d out
# Hermes stores non-ASCII as UTF-16 — a UTF-8 grep will miss Hindi and
# Bengali strings and tell you a shipped feature is missing.
grep -a "some string the release should contain" out/base/assets/index.android.bundle
```

---

## 5. Submit

```bash
npx eas submit --platform android --profile production
```

That profile uploads to the **internal** track as a **draft**, so nothing
reaches the public listing by accident. Promote it from the Play Console when
you are ready.

A release that changes what data is collected, or adds a permission, also
needs the Play Console data safety form updated before it will pass review —
see [release/PLAY-DATA-SAFETY.md](release/PLAY-DATA-SAFETY.md).

---

## 6. Tag it

Once the release is live:

```bash
git checkout main && git pull
git tag -a v1.0.1 -m "1.0.1 — build 13"
git push origin v1.0.1
```

Fill the build number into `CHANGELOG.md` — it is the one thing that cannot
be known before the build runs — and open the next version's branch when the
next piece of work starts.

---

## Hotfixes

A fix for something already in a farmer's hands follows the same path, only
faster and smaller. Open `v1.0.2` from `main`, fix the one thing, open the
release PR, ship it.

The temptation is to skip the review because it is urgent. Don't — urgency is
when mistakes get made, and a bad hotfix reaches people who have already been
inconvenienced once.

**There is no over-the-air route.** `expo-updates` is not installed, so every
fix — including a one-line JavaScript change — needs a new build and a store
update. Adding OTA is worth doing before the user base is large enough that a
store round trip is a real cost.

---

## What is not automated, and why

| Step | Why it is by hand |
| --- | --- |
| Promoting from internal to production | Someone should look at the listing before thousands of people do |
| Applying migrations | Order matters relative to the deploy, and getting it wrong is not reversible |
| The store listing text and screenshots | They go stale silently, so they are re-read at each release |

---

## Credentials

| What | Where |
| --- | --- |
| Android keystore | EAS, account `karolix07`, credentials `lyYn68oBwi`. **Losing it means never updating this listing again** — Play identifies an app by its signing key. |
| Production environment | EAS environment `production`, not `.env` |
| API secrets | Render environment |
| Play Console | The Google account that owns the listing |

**FCM credentials are not configured.** Until a Firebase project exists for
`com.agronavis.app` and its service account is uploaded through
`eas credentials`, no push notification reaches any device — alerts are
written and appear inside the app, but no handset is woken.
