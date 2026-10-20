# Play Console — Data safety answers

Filled from what the code actually sends, not from what the app intends to do.
Every claim here can be checked against a file named beside it.

Google compares these answers to the privacy policy at
`https://agronavis.in/privacy` and to the permissions in the manifest. Where
they disagree, the submission is rejected. Keep all three in step.

---

## Overview questions

**Does your app collect or share any of the required user data types?**
Yes.

**Is all of the user data collected by your app encrypted in transit?**
Yes. The API is HTTPS only (`https://agronavis-api.onrender.com/api/v1`), as
is Supabase. There is no cleartext endpoint.

**Do you provide a way for users to request that their data is deleted?**
Yes. Profile → Delete My Account removes the account and everything attached
to it. `DELETE /farmers/me`, `backend/src/modules/farmers/farmers.controller.ts`.

---

## Data types

For every row below: **collected = yes, shared = no, processed ephemerally =
no, required = varies, purpose = app functionality.** Nothing is sold, nothing
goes to advertisers, and there is no analytics or ads SDK in the project —
check `package.json`.

### Personal info

| Data | Collected | Required | Why |
|---|---|---|---|
| Name | Yes | Optional | Shown on the profile and beside community posts |
| Email address | Yes | Required | Sign-in identity, held by Supabase Auth |
| Phone number | Yes | Optional | Profile field, used for account recovery |
| User IDs | Yes | Required | The account identifier every record hangs off |

Also stored: preferred language, state and district. These are in the
"personal info — other" bucket if asked; they localise prices and soil data.

Table: `farmers` — `id, email, full_name, phone, language, state, district,
avatar_url`.

### Location

| Data | Collected | Required | Why |
|---|---|---|---|
| Approximate location | Yes | Optional | District, to pick the right soil and mandi data |
| Precise location | Yes | Optional | Centres the map when mapping a field, and locates the field itself |

**Read in the foreground only.** Nothing is read in the background and there is
no background location permission in the manifest. Precise location is used
when the farmer taps the locate button, and the field boundary they draw is
itself precise location — treat it as such on the form.

### Photos and videos

| Data | Collected | Required | Why |
|---|---|---|---|
| Photos | Yes | Optional | A leaf photograph for a disease reading; pictures attached to community posts |

Crop scan photographs are stored in a **private** bucket (`crop-scans`,
`isPublic: false`) readable only by their owner. Community photographs are
visible to other farmers, because that is what the feature is.

### Audio

**Not collected.** The microphone is used for speech input to Sahayak, and the
speech is turned into text on the handset by the system recogniser. No
recording is stored or transmitted. Declare the permission, declare no audio
data collection.

### Messages

| Data | Collected | Required | Why |
|---|---|---|---|
| Other in-app messages | Yes | Optional | Community posts and replies, which other farmers can see |

Sahayak conversations are **not** collected. The language model runs on the
device; questions and answers never leave the handset.

### App activity

| Data | Collected | Required | Why |
|---|---|---|---|
| Other user-generated content | Yes | Optional | Field boundaries, crop records, tasks, scan history |

### Device or other IDs

| Data | Collected | Required | Why |
|---|---|---|---|
| Device or other IDs | Yes | Optional | An Expo push token, so alerts can reach the phone |

---

## Security practices

- **Encrypted in transit:** yes, everywhere.
- **Users can request deletion:** yes, in the app and by email to
  `contact@agronavis.in`.
- **Committed to Play Families policy:** not applicable — the app is for
  adults, and the terms say so.
- **Independent security review:** no. Answer honestly; claiming one invites a
  request for the report.

---

## Things that are easy to get wrong here

**Field boundaries are precise location.** They are the exact coordinates of
someone's land. Declaring them only as "user-generated content" understates
what they are.

**Audio is a permission, not a data type.** `RECORD_AUDIO` is in the manifest
and the form asks about collected *data*. Speech becomes text on the device
and nothing is kept, so the honest answer is permission yes, data no.

**Community content is shared with other users, not with third parties.**
Google means sharing outside the app's own operation. Other farmers seeing a
post is the feature working, not a transfer.

**The policy must say all of this too.** `PRIVACY.md` §2 lists every
permission and what it is for. The hosted policy at agronavis.in is missing
the camera and the microphone — fix that before submitting, or the form and
the policy disagree.

---

## Still to do before submitting

- Add an account-deletion page on the website. Play wants a public URL as
  well as the in-app route, for people who have already uninstalled.
- Add camera and microphone to the hosted privacy policy.
- Add the provider attribution Mapbox and OpenStreetMap require.
