## What this changes

<!-- One or two sentences. What is different after this merges? -->

## Why

<!-- The problem being solved. Link the issue if there is one. -->

Closes #

## How it was verified

<!-- What you actually ran or observed. "Tests pass" on its own is not enough
     if the change touches behaviour a test does not cover. -->

- [ ] `npm run verify` passes — typecheck, lint and tests, app and API
- [ ] Checked on a device or in a browser, not only in tests
- [ ] Migrations applied and reversible, if the schema changed

## Risk

<!-- Delete the lines that do not apply. -->

- [ ] Changes the database schema
- [ ] Changes an API response shape the app depends on
- [ ] Adds or changes a dependency
- [ ] Needs a new environment variable or secret — **listed below**
- [ ] Needs a native rebuild (new native module or config plugin)
- [ ] Changes what data is collected or who it is shared with — **PRIVACY.md updated**

## Notes for the reviewer

<!-- Anything you are unsure about, or deliberately left out of scope. -->
