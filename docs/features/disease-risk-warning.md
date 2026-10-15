# Fungal disease risk warning

Warns a farmer when the weather ahead will wet the leaves of their crop long
enough for blast or blight to take hold.

Shipped in [#13](https://github.com/jpdevhub/Agronavis-App/pull/13).

---

## The problem it solves

A fungal spore landing on a leaf does nothing. To germinate it needs **liquid
water sitting on that leaf for several hours**. Get the warning out before the
wet night rather than after the lesions appear and a preventive spray costs a
fraction of a rescue.

So the question is: _will the leaves be wet tomorrow morning?_

## Why the first answer was wrong

The rule used to be `humidity >= 85%`.

Relative humidity is **a ratio, not a quantity**. It is the fraction of water
the air holds against what it _could_ hold at its current temperature, and warm
air holds far more. So across one day, with no water added or removed at all,
the same air reads 50% at three in the afternoon and 95% at five in the
morning.

An 85% threshold therefore measures temperature about as much as it measures
moisture, and it is wrong in both directions:

| Weather                                              | Old rule              | What actually happens                                                   |
| ---------------------------------------------------- | --------------------- | ----------------------------------------------------------------------- |
| Muggy afternoon, 41 °C, 55% RH, night holds at 29 °C | _silent_ — RH too low | Correct. Air never approaches its dew point, nothing condenses          |
| Humid afternoon, 85% RH, night holds at 29 °C        | **warns**             | Wrong. Still nothing condenses. A wasted spray                          |
| Clear night, 78% RH, low of 19 °C                    | _silent_ — RH too low | **Wrong. Every leaf is wet by dawn.** The real infection window, missed |

The third row is the costly one. 78% is nowhere near the old threshold, and it
is exactly the night a farmer needed telling about.

## How it works now

```
dew point   ←  Magnus-Tetens, from the day's mean temperature and mean humidity
leaves wet  ←  tempMin − dewPoint ≤ 2 °C
risk day    ←  leaves wet AND tempMin ≥ 18 °C AND tempMax ≤ 32 °C
warn        ←  two or more such days in the five-day forecast
```

**Dew point** is the temperature at which air gives up its water onto whatever
is coolest — on a clear night, the crop. Unlike relative humidity it barely
moves across a day, because it tracks the water actually present rather than
the fraction of a moving ceiling. That makes it the right thing to threshold.

**The 2 °C margin** is not a fudge. A leaf radiates heat to an open sky and
settles a degree or two below the surrounding air, so dew forms on the crop
before a thermometer in a screen agrees it should.

**Mean temperature, not max.** `ForecastDay.humidity` is already averaged over
OpenWeather's eight three-hour slots, so it has to be paired with the mean
temperature — `(tempMin + tempMax) / 2`. Pairing a mean humidity with a maximum
temperature would understate the dew point badly.

**The temperature band is unchanged.** 18–32 °C is where blast and blight
actually sporulate. Only the moisture test was replaced.

## Where the code lives

|                                                    |                                                                                                                                                                                      |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `backend/src/modules/weather/et0.ts`               | `dewPoint()` — Magnus-Tetens with the Alduchov-Eskridge coefficients, accurate to about 0.1 °C between −40 and 50 °C. Sits beside the saturation vapour pressure FAO-56 already uses |
| `backend/src/modules/advisory/advisory.service.ts` | `leavesWetOvernight()` and `buildDiseaseRiskAdvisory()`                                                                                                                              |
| `backend/tests/unit/dew-point.test.ts`             | 15 tests, including both rows the old rule got wrong                                                                                                                                 |

Nothing changed on the wire. The advisory is built on the server and
`ForecastDay` already carried temperature and humidity, so there is no API
change, no key, no dependency and no migration.

---

## Where the warning actually goes — and the gap

This is the part worth reading before relying on it.

```
weather.job (cron)
  └─ buildDiseaseRiskAdvisory()
       └─ insertDrafts()  →  row in `advisories`
            └─ push notification  ONLY IF severity === 'critical'
```

The fungal warning is **`severity: 'medium'`**. So it is written to the
`advisories` table and **no notification is sent**.

And nothing displays it:

| Surface                            | Reads advisories?                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Dashboard                          | No — it renders tasks, weather and soil                                                                       |
| Tasks                              | No — those come from the crop timeline trigger, a separate table                                              |
| Notification bell on the dashboard | No — it is a `TouchableOpacity` with no `onPress`                                                             |
| Any notifications screen           | There isn't one                                                                                               |
| **Sahayak**                        | **Yes** — `useAdvisories` is imported by `useSahayak` alone, to put open advisories in the assistant's prompt |

So today a farmer learns about fungal risk **only if they open Sahayak and
ask**. The rule is correct and the delivery is missing.

The same is true of every other advisory. Irrigation, heavy rain, extreme heat
and pest alerts all land in the same table. The three that are marked
`critical` — a shortfall over 18 mm, rain over 60 mm, heat at or above 45 °C —
do fire a push notification, but there is still no screen on which to read them
afterwards.

### What is already built

More than half of it, which is why this is worth finishing rather than
starting:

- `notifications` table, with read state
- `notificationsService.send()` — stores the row, then delivers through Expo push
- `GET /notifications`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`
- `notificationApi` in `services/endpoints.ts` — written, and **never called**
- `usePushNotifications` — asks permission and registers the device token with the API
- An onboarding step that asks for notification permission

### What is missing

- A notifications screen, and a bell that opens it
- An unread badge
- Advisories surfaced on the dashboard, where the farmer already looks
- A notification on anything below `critical`
- Any welcome or first-run guidance
