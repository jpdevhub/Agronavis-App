# Contributing

**`main` is production.** 1.0.0 is on Google Play. Nothing reaches `main`
except through a reviewed PR with CI green.

## The loop

```bash
git checkout -b release/v1.0.1   # named for the release, not the feature
# commit as much as it takes, push freely
npm run verify                   # typecheck + lint + tests, app and API
gh pr create --base main         # one PR per release — merging it is the release
```

Needs **1 review** + **2 green checks**. No direct pushes to `main`.

> `release/` prefix matters: shipping tags the commit `v1.0.1`, so a branch of
> that exact name collides with its own tag every release.

## Versions

| Bump | When |
| --- | --- |
| **1.0.0 → 1.0.1** | Fix to something that shipped |
| **→ 1.1.0** | Farmer can do something new |
| **→ 2.0.0** | Works differently, drops data, or breaks an old client |

An API change an old build can't survive is **major** — an installed APK keeps
calling the paths it was built with. Add beside the old shape, don't replace.

Version lives in `app.config.js` → `VERSION`. `versionCode` is EAS's, not ours.

## Checklist

- [ ] `npm run verify` passes
- [ ] You ran the app, not just the tests
- [ ] New behaviour has a test that fails without the fix
- [ ] Migration is numbered and idempotent, if schema changed
- [ ] `CHANGELOG.md` line added — written for a farmer, not a reviewer
- [ ] `npm run legal` re-run if `features/legal/documents.ts` changed

## Needs more than a review

| Change | Also |
| --- | --- |
| Schema | Migration applied to prod **before** the code deploys |
| Data collected/shared | `npm run legal` + Play data safety form |
| New permission | Reason in the listing + changelog line |
| Native module or plugin | Fresh build — OTA can't carry native code |

## House style

- **Say what you don't know.** An empty list isn't "nothing is burning near
  you". A model with no rates must decline, not invent a price.
- **Comments explain why, not what.** Record the bug this shape prevents.

Releasing: **[docs/RELEASING.md](docs/RELEASING.md)**
