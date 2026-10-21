# Play Console — every section, answered

What to put in each part of the submission checklist. Answers come from what
the code does, not from what the app aspires to; where something is missing,
it says so rather than offering a comfortable answer.

Read alongside [PLAY-DATA-SAFETY.md](PLAY-DATA-SAFETY.md), which covers that
section in full.

---

## ⚠ One policy gap to close first

**There is no way to report a post or block a farmer.**

Google's User Generated Content policy requires an app whose users can post
content others see to provide a reporting path, a blocking mechanism, and
moderation. Agronavis has posts and replies, and the only control is deleting
your own. This is not the Data Safety section — it is a separate policy, and
apps are refused under it.

What it needs: a report control on each post and reply, somewhere for reports
to go, and a way for a farmer to block another so they stop seeing them. Small
in code, and a hard requirement.

---

## Set privacy policy

```
https://agronavis.in/privacy
```

Live, and it now names the camera, the microphone and the photo library.

---

## Sign-in details

Reviewers cannot see past the sign-in screen without an account, and an app
they cannot open is refused as broken.

Provide:
- A working email and password for a test account
- **A field already mapped on it.** Nearly every screen is empty without one,
  and a reviewer will not draw a boundary to find out what the app does.
- A note: *"Sahayak is an on-device assistant and needs a one-time 3.7 GB
  download. It is not required to review the rest of the app."*

Without that last line a reviewer may begin a multi-gigabyte download on a
test device, give up, and mark the feature broken.

---

## Ads

**No ads.** The project contains no advertising SDK — no AdMob, no mediation,
nothing. Answer *"No, my app does not contain ads."*

---

## Content rating

A questionnaire, not a choice. Answer it honestly; the rating follows.

| Question | Answer |
|---|---|
| Violence, sexual content, profanity, drugs, gambling | No to all |
| **Users can interact** | **Yes** — community posts and replies |
| **Users can share user-generated content** | **Yes** |
| Shares location with other users | **No.** Field boundaries are never shown to anyone else |
| Allows purchases | No |

Expect **PEGI 3 / ESRB Everyone** with an interactive-elements note. The two
"yes" answers are what make the UGC policy above apply.

---

## Target audience

**18 and over.** The terms say so, and that is the honest answer for a product
about managing farmland and money.

Choosing any band below 18 pulls the app into Families policy, which brings
requirements it does not meet and does not need.

Answer **No** to "appeals to children".

---

## Data safety

Covered fully in [PLAY-DATA-SAFETY.md](PLAY-DATA-SAFETY.md). In short: data is
collected, none is shared with third parties, everything is encrypted in
transit, and deletion is available both in the app and at
`https://agronavis.in/delete-account`.

---

## Government apps

**No.** Agronavis reads published government data — the Soil Health Card
scheme, Agmarknet prices, fertiliser catalogues — and is not made by,
endorsed by, or affiliated with any government body. Answering yes would be a
false claim of affiliation.

---

## Financial features

**No** to every option. The app takes no payments, offers no loans, no
insurance, no investment advice, and contains no payment SDK.

Mandi prices are published market data, shown as information. They are not a
quotation, an offer, or a brokerage, and the terms say so.

---

## Health

**No.** The disease scanner reads a photograph of a *plant*. Nothing in the
app concerns human health, and Play's health category does not apply to crops.

---

## App category and contact details

| | |
|---|---|
| **Application type** | App |
| **Category** | Business. (Weather and Food & Drink both look tempting and both describe a part of it; Business is where farm-management tools sit and is the honest fit.) |
| **Email** | contact@agronavis.in |
| **Website** | https://agronavis.in |
| **Phone** | Optional — leave blank unless one is actually answered |

---

## Store listing

**App name** — `Agronavis` (30 characters max).

**Short description** (80 max):

```
Soil, weather and market prices for the field you farm.
```

**Full description** (4000 max):

```
Agronavis answers questions about one field: the one you map.

Draw your boundary once. From then on the app reads what is above and below
that ground, and tells you what it means.

SOIL
Twelve nutrients for your district, from the Government of India's Soil Health
Card scheme, with the number of laboratory samples behind each reading so you
can judge how firm it is.

WATER
How much water the soil is holding, measured by satellite rather than worked
out from rainfall, beside what the water balance says the crop needs.

CROP HEALTH
Sentinel-2 imagery at ten metres, every clear pass. The app leads with the
change since last time, because a single reading means little on its own.

DISEASE
Photograph a leaf and get the likely condition with a confidence figure — and
the honesty to say when it does not know.

SMOKE
Stubble fires within 150 km, and whether the wind is bringing their smoke to
your field.

PRICES
Mandi rates from the Agmarknet network for the commodities you grow.

SAHAYAK
A farming assistant that runs on your phone. Your questions never leave it.

WHAT THIS APP WILL NOT DO
It will not pretend to certainty it does not have. Soil figures describe your
district, not your plot. Satellite readings are estimates over your
coordinates. A disease reading from one photograph can be wrong. The app says
so, every time, because a confident wrong answer costs a season.

Agronavis does not sell your data, show advertisements, or share your field
boundaries with anyone.
```

**Graphics required:**

| Asset | Spec |
|---|---|
| App icon | 512×512 PNG, 32-bit |
| Feature graphic | 1024×500 PNG or JPEG, no transparency |
| Phone screenshots | 2–8, min 320 px, max 3840 px, 16:9 or 9:16 |

For screenshots, the dashboard with a mapped field, the crop health map, the
fire watch, the disease scanner and Sahayak show the app at its most useful.
Use a field with real data — an empty dashboard sells nothing.

---

## Order worth doing them in

1. Build the report-and-block path. It is the only true blocker left in code.
2. Privacy policy, government, financial, health, ads — minutes each.
3. Content rating and target audience.
4. Data safety, from the companion document.
5. Store listing and graphics, which take the longest.
6. Upload the AAB to internal testing before production.
