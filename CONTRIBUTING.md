# Contributing to Agronavis

**`main` is production.** Agronavis 1.0.0 is published on Google Play, and
every commit on `main` is a candidate for the next thing a farmer installs.
Treat it accordingly: nothing lands there except through a reviewed pull
request that CI has passed.

This is not a repository where a broken build is an inconvenience. A farmer
opens this app to decide whether to irrigate, whether to spray, and whether
their crop is worth carting to the mandi today. A wrong number is worse than
no number.

---

## The rule

> Work happens on a branch named for the release it is going into —
> `release/v1.0.1` — and reaches `main` through one pull request when that
> release is ready to ship.

No direct pushes to `main`. No exceptions for "it is only one line": the
one-line changes are the ones nobody reviews and nobody notices.

### One branch per release

The branch is named after the version, not the feature, because a release is
the unit that reaches a farmer. Decide the version first — the table below
says which bump a change earns — then open the branch for it:

```bash
git checkout main && git pull
git checkout -b release/v1.0.1
```

The `release/` prefix is not decoration. Shipping tags the commit `v1.0.1`,
and a branch of that exact name would make every reference to it ambiguous —
git refuses to push one while the other exists. The prefix keeps the branch
and the tag from ever being the same name.

Everything going into that release is committed there. Push freely and as
often as you like: it is a branch, nobody is running it, and a hundred commits
on it are a hundred commits nobody has to reconstruct later. Keep each one
about one thing, with a subject that says what changed for a farmer rather
than which file moved.

```bash
npm run verify          # typecheck, lint and tests — app and API
git push                # to the release branch, never to main
```

`main` only hears about it once, at the end:

```bash
gh pr create --base main --title "1.0.1"
```

That pull request is the release. It needs **one approving review** and
**both checks green** before it can merge:

| Check | What it protects |
| --- | --- |
| `Lint, typecheck and test` | 190 app tests, 267 API tests, no type or lint errors |
| `Build API` | The server compiles **and its built entrypoint loads** |

That second half is there because it was learned the hard way: a package
whose `main` points at TypeScript source compiled perfectly, passed every
test, and then would not boot — and the deploy it gated crash-looped while
CI showed green.

---

## Versions

Agronavis follows [Semantic Versioning](https://semver.org/). For an app a
farmer installs, read the three numbers like this:

| Bump | When | Example |
| --- | --- | --- |
| **Patch** — 1.0.0 → **1.0.1** | A fix to something that already shipped. No new screens, no new permissions, nothing to re-learn. | Mark-all-read returning 500; a card overlapping the nav bar |
| **Minor** — 1.0.x → **1.1.0** | Something a farmer can now do that they could not before. | A new advisory type; a language the screens are actually in |
| **Major** — 1.x → **2.0.0** | The app works differently enough that someone who knows 1.x would be surprised. Also any change that drops data or breaks an old client. | — |

**The API and the app share a version number** because they ship as one
product, but they do not ship at the same moment. An installed APK keeps
calling whatever paths it was compiled with, so an API change that an old
build cannot survive is a **major** bump, not a minor one — add the new shape
beside the old rather than replacing it.

### Where the version lives

| | |
| --- | --- |
| The branch name | `release/v1.0.1` — decided when the branch opens, so every commit on it knows what it is for |
| `app.config.js` → `VERSION` | The user-facing `1.0.1`. The only place to edit it, bumped in the branch's first commit. |
| `versionCode` | **Not in the repo.** `eas.json` sets `appVersionSource: "remote"`, so EAS owns the Android build number and increments it per production build. |
| `CHANGELOG.md` | Every released version, newest first, with the build number that actually reached Play. |
| `package.json` | Follows `VERSION` on release. |

---

## The changelog is part of the change

If a commit alters something a farmer would notice, it adds its line to that
version's section of `CHANGELOG.md` in the same commit. Writing the changelog
at the end means writing it from a hundred commit subjects, which is how
entries like "fix various issues" happen.

Write for the farmer, not the reviewer:

> **Good** — The fire watch told farmers their fields were clear when the
> request had failed.
>
> **Bad** — Fixed error handling in `firesService.near()`.

---

## Before the release pull request

- [ ] `npm run verify` passes
- [ ] You ran it, not just the tests — on a device, an emulator, or the web build
- [ ] New behaviour has a test, and the test would fail without the fix
- [ ] A migration, if the schema changed, and it is idempotent
- [ ] `CHANGELOG.md` updated under this version's section if a farmer would notice
- [ ] `npm run legal` re-run if you edited `features/legal/documents.ts`

The pull request template asks the rest.

---

## Things that need more than a review

| Change | Also required |
| --- | --- |
| Database schema | A numbered, idempotent migration in `supabase/migrations/`, applied to production **before** the code that needs it deploys |
| What data is collected or shared | `PRIVACY.md` updated via `npm run legal`, **and** the Play Console data safety form |
| A new permission | A reason in the listing, and a line in the changelog saying why |
| A new native module or config plugin | A fresh development build — OTA cannot carry native code |
| Anything a farmer acts on | Say what it does not know. See below. |

---

## The house style

Two rules account for most of the review comments on this repository.

**Say what you do not know.** A farmer forgives an app that says "I am not
sure" and never opens one again after it was confidently wrong. Every path
that cannot produce a real answer must say so rather than produce a plausible
one — an empty list is not the same as "nothing is burning near you", and a
model with no mandi rates in front of it must decline rather than invent a
price.

**Comments explain why, not what.** The code says what it does. A comment
earns its place by recording the thing the next person cannot see: the bug
this shape prevents, the constraint that forced it, the obvious approach that
did not work.

---

## Releasing

Cutting a release — version bump, changelog, build, submission — is written
out step by step in **[docs/RELEASING.md](docs/RELEASING.md)**.
