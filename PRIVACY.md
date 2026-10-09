# Privacy

**Last updated: 2026-10-09**

This describes what Agronavis collects, why, where it goes, and what you can do
about it. It is also the source document for the privacy policy published on
our website and in the Play Store listing — the two should always say the same
thing.

Plain-English summary, with the detail below:

- We collect what the app needs to advise your fields, and nothing for
  advertising.
- Your field boundaries are precise locations of your land. We treat them as
  the most sensitive thing we hold.
- Your conversations with Sahayak never leave your phone.
- We do not sell your data, and we do not share it with advertisers.

---

## What we collect

### You give us this

| Data                                    | Why                                                        |
| --------------------------------------- | ---------------------------------------------------------- |
| Email address                           | To create and recover your account                         |
| Name                                    | To address you in the app                                  |
| Phone number _(optional)_               | Account recovery                                           |
| Village, district, state                | To find your district's soil records and your mandi prices |
| Preferred language                      | To show the app in English or Hindi                        |
| Profile photo _(optional)_              | Shown on your profile and community posts                  |
| Irrigation type, soil type, crops grown | To make advice specific to your farm                       |

### The app records this as you use it

| Data                                                  | Why                                                                                    |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Field boundaries** — the exact coordinates you draw | Everything specific depends on it: your soil reading, your weather, your water balance |
| Field names and calculated area                       | To tell your plots apart, and to size future dose recommendations                      |
| **Photographs of crops** you scan                     | To identify the disease, and to keep a record on your farm                             |
| Crops planted and their dates                         | To build your season's task list                                                       |
| Tasks you complete or skip                            | So the list stays correct                                                              |
| Community posts and replies you write                 | They are visible to other farmers in your district                                     |
| Device push token                                     | To send you alerts you asked for                                                       |

### Automatic

| Data                                                | Why                                                                                                        |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Device location _(only when you ask)_               | To centre the map on you when mapping a field. Taken when you tap the locate button, not in the background |
| Server logs — request time, endpoint, error details | To keep the service running and diagnose faults                                                            |

**We do not collect** contacts, call logs, SMS, installed apps, browsing
history, advertising identifiers, or continuous background location.

---

## Your conversations with Sahayak stay on your phone

Sahayak runs a language model **on your device**. What you type or say to it,
and what it answers, is processed on the handset and is never sent to us or to
anyone else.

To answer usefully it reads your farm details — your fields, soil reading and
current weather — from a copy stored on your phone. That copy stays on the
phone too.

Speech recognition and speech output use your device's own services. Depending
on your phone's manufacturer and settings, those may process audio on-device or
on the manufacturer's servers; that is governed by your device's own privacy
settings, not by us.

---

## Who else sees your data

We do not sell your data. We do not share it with advertisers. These are the
only parties involved, and each receives only what it needs:

| Who                         | What they get                                                    | Why                                       |
| --------------------------- | ---------------------------------------------------------------- | ----------------------------------------- |
| **Supabase**                | Everything we store, including your account and field boundaries | Our database, sign-in and file storage    |
| **Render**                  | Your requests as they are processed                              | Runs our API                              |
| **NASA POWER**              | A field's coordinates                                            | Rainfall and sunlight for that point      |
| **OpenWeatherMap**          | A field's coordinates                                            | Current conditions and forecast           |
| **Mapbox**                  | Map area you are viewing                                         | Satellite imagery for the map             |
| **OpenStreetMap Nominatim** | A field's coordinates                                            | Converting coordinates to a district name |
| **Expo push service**       | Your device push token and the alert text                        | Delivering notifications                  |

None of these receive your name, email or phone number. The weather, map and
geocoding services receive coordinates without anything identifying you.

**Agmarknet, the Soil Health Card scheme and the fertiliser scheme receive
nothing.** We read their published data on a schedule; they never see you.

---

## Where it is stored, and for how long

Data is held in Supabase. We keep it while your account exists.

| Data                  | Kept for                                   |
| --------------------- | ------------------------------------------ |
| Account and profile   | Until you delete your account              |
| Fields and farms      | Until you delete them, or your account     |
| Crop scan photographs | Until you delete the scan, or your account |
| Community posts       | Until you delete them, or your account     |
| Server logs           | 30 days                                    |

---

## Deleting your account

You can delete your account from **Profile → Security**. Deletion removes your
profile, your farms and fields, your scans and their photographs, your tasks,
your advisories and your community posts. It is immediate and cannot be undone.

Cached public data — district soil records, mandi prices — is not personal to
you and remains.

---

## Your rights

You can ask us to:

- **See** everything we hold about you
- **Correct** anything that is wrong
- **Delete** your account and its data
- **Export** your data in a machine-readable form
- **Object** to a particular use

Email **[privacy@agronavis.example]**. We will reply within 30 days.

---

## Children

Agronavis is intended for adults who farm. We do not knowingly collect data
from anyone under 18. If you believe a child has given us data, write to us and
we will remove it.

---

## Security

The app never connects to the database directly — every request goes through
our API, which checks that you own the record before answering. Two-factor
authentication is available, and its secret is encrypted at rest. The full
posture, and how to report a vulnerability, is in [SECURITY.md](SECURITY.md).

No system is perfectly secure. If a breach affects your data we will tell you
and the relevant authority as the law requires.

---

## Legal basis and jurisdiction

We process this data to provide the service you asked for, and on your consent
for optional items such as location and notifications. You may withdraw consent
at any time in your device settings, though some features will stop working.

Agronavis operates in India and intends to comply with the Digital Personal
Data Protection Act, 2023.

---

## Changes

Material changes will be announced in the app before they take effect, and the
date at the top of this page will change. Past versions are in this repository's
history.

---

## Contact

**[privacy@agronavis.example]**
[Registered business name and address]
