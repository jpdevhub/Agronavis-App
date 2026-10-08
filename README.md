<div align="center">

# Agronavis

### Every field in India, advised.

Soil, weather, crops, disease and the day's market price — for one mapped field,
in the farmer's own language.

</div>

---

## The problem

An Indian farmer makes four decisions every season. Each one costs money when it
goes wrong, and each one is usually made without data.

| The question                   | How it is answered today                                          |
| ------------------------------ | ----------------------------------------------------------------- |
| What is in my soil?            | The government measured it. The farmer has never seen the number. |
| When do I water?               | Guesswork, or waiting and hoping the rain arrives in time.        |
| What is this spot on the leaf? | Ask a neighbour, or buy whatever the shop suggests.               |
| What is my crop worth?         | Make the trip to the mandi and find out on arrival.               |

Every one of these already has an answer sitting in a public government dataset.
None of them reach the person standing in the field.

**Agronavis answers all four, for one field, from the moment the farmer draws it
on a map.**

---

## How it works

**It starts with the boundary.** The farmer traces their field on satellite
imagery, once. Everything afterwards is about that field — not a district
average, not a village estimate, not the nearest weather station. A farm can
hold many fields, and plots hundreds of kilometres apart read differently.

|             | What the farmer gets                                                                                                          |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Soil**    | Nitrogen, phosphorus, potassium and nine more nutrients, from the government's own laboratory testing of their district.      |
| **Weather** | Live conditions over the field, and the one answer that matters — how much water the crop is losing, and whether to irrigate. |
| **Crops**   | A season laid out as dated tasks, chosen from the crops the national scheme actually lists for their state.                   |
| **Scanner** | Photograph an affected leaf; an answer in about a second, with the next two most likely conditions beside it.                 |
| **Market**  | A representative price for their state with its range, and the mandis that reported it.                                       |
| **Sahayak** | An assistant that already knows their fields, soil and weather. They can speak to it, and it speaks back.                     |

---

## What is loaded today

These are counts from the live production database, not projections.

|            |                                        |
| ---------- | -------------------------------------- |
| **712**    | districts of soil data                 |
| **32**     | states and territories                 |
| **11,332** | market price records                   |
| **1,491**  | mandis reporting prices                |
| **4,172**  | mandis in the directory                |
| **1,812**  | crops in the scheme catalogue          |
| **86**     | crop conditions the scanner recognises |
| **2**      | languages live — English and Hindi     |

---

## Every number has an owner

| What the farmer sees | Where it comes from              | Who owns it         |
| -------------------- | -------------------------------- | ------------------- |
| Soil nutrients       | Soil Health Card survey          | Government of India |
| Rain and sunlight    | POWER satellite record           | NASA                |
| Water requirement    | Penman–Monteith method           | United Nations FAO  |
| Mandi prices         | Agmarknet reporting network      | Government of India |
| Crop lists           | Fertiliser recommendation scheme | Government of India |
| Disease reading      | Our own trained model            | Agronavis           |

Five of the six come from public institutions. We are not asking a farmer to
trust our opinion — we are delivering records that already exist, to the field
they belong to.

---

## Why this one gets used

A farmer forgives an app that says _"I am not sure"_. They never open one again
after it was confidently wrong. So Agronavis is built to admit what it does not
know:

- **The scanner refuses photographs that are not crops**, instead of forcing
  every image into one of its 86 labels the way these models normally do.
- **A weak reading is labelled a hint, never a diagnosis**, and the farmer is
  always asked to confirm against the reference library before spraying.
- **Soil readings show their evidence** — the full High/Medium/Low split and the
  number of samples behind it. A thinly tested district is marked as one.
- **When district data is missing**, the reading widens to the state and says so,
  rather than inventing a number.
- **The irrigation advice shows its working**, as a full daily record anyone can
  check.

---

## What comes next

- Five more languages — Marathi, Punjabi, Gujarati, Telugu and Kannada
- Fertiliser and pesticide quantities worked out for the field's actual acreage
- A second model dedicated to deciding whether a photograph shows a crop at all
- Dated task timelines extended across the full crop catalogue

---

## References

| Used for                | Source                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| Water requirement       | Allen, Pereira, Raes & Smith (1998). _Crop Evapotranspiration._ FAO Irrigation & Drainage Paper 56 |
| Sunlight and rainfall   | NASA POWER — Prediction Of Worldwide Energy Resources, NASA Langley Research Center                |
| Soil nutrients          | Soil Health Card scheme, Department of Agriculture & Farmers Welfare, Government of India          |
| Market prices           | Agmarknet, Directorate of Marketing & Inspection, Government of India                              |
| Scanner architecture    | He, Zhang, Ren & Sun (2016). _Deep Residual Learning for Image Recognition._ CVPR                  |
| Crop detection in frame | Woebbecke, Meyer, Von Bargen & Mortensen (1995). _Color Indices for Weed Identification._ ASAE     |

---

## For developers

Setup, architecture, scripts and deployment are in
**[docs/DEVELOPMENT.md](docs/DEVELOPMENT.md)**. How every model works, and what
we got right and wrong, is in **[docs/PRESENTATION.md](docs/PRESENTATION.md)**.

```bash
git clone https://github.com/jpdevhub/Agronavis-App.git && cd Agronavis-App
cp .env.example .env
npm install --legacy-peer-deps
npm run dev
```
