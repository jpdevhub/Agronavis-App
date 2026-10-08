# Agronavis — Video Narration Script

Read this aloud over a screen recording of the app. No other footage is needed.

476 words, which runs **about 3 minutes 25 seconds** including the two pauses.
The words in _(brackets)_ are not spoken — they only tell you which screen
should be showing while you say the line next to them.

If you have a hard three-minute limit, see [cutting it
down](#cutting-it-to-three-minutes).

---

## The Script

_(The app opening. Let it sit on the home screen for a moment before you start.)_

An Indian farmer makes four decisions every season.

What his soil needs. When to water. What the spots on his leaves are. And what
his crop is worth.

Each one costs him money if he gets it wrong.

And he makes all four without any data.

---

Which is strange. Because the answers already exist.

The government tested his soil and published the result. NASA measures the rain
that falls on his field every single day. The mandi publishes today's price.

All of it is public. None of it reaches him.

The problem isn't missing science. It's missing delivery.

---

_(The map screen. Draw the field boundary slowly while you say this.)_

So Agronavis starts with one action.

He draws his field on the map.

That's the whole setup. And from here, everything is about that field. Not his
district. Not his village. That field.

---

_(The dashboard, then open the full soil report.)_

His soil. Nitrogen low. Phosphorus high.

That isn't an estimate. Those are the government's own laboratory results for
his district — and we show how many samples they're based on, so he can judge
how much to trust them.

---

_(The weather card, then open the full weather record.)_

His weather. Today's conditions, and the one line that actually matters.

Irrigate today.

That comes from the United Nations' water balance equation, not a rule of thumb.
And the full record sits behind it, if he wants to check our working.

---

_(The crop picker. Choose a crop, then show the task list.)_

His crops. Only the ones his state's scheme actually recognises, so nothing on
screen is noise.

He picks one, and the whole season lays itself out as dated tasks.

---

_(Open the camera, photograph a diseased leaf, hold on the result.)_

A spot on a leaf. He photographs it.

One second.

The crop, the condition, and the next two possibilities. With a reminder to
confirm before he sprays — because a photograph can't tell him the dose.

---

_(The mandi screen.)_

Today's price for his state. The range it moved in, and the mandis that reported
it.

---

_(Open Sahayak. Ask a question out loud in Hindi.)_

And if he just wants to ask — he can. In Hindi. Out loud.

**— then stop talking for about four seconds and let the real voice play —**

---

_(Leave the app. A plain screen, or hold on the dashboard.)_

Two things make this work that you can't see on the screen.

Sahayak runs on his phone. Not on our server. A three gigabyte language model,
running on the handset.

So it works with no signal. And it costs us nothing per question — where a cloud
AI would charge us for every message a million farmers ever send.

The leaf scanner runs inside our own API. The original version needed a gigabyte
of libraries, and our server has five hundred and twelve megabytes. It couldn't
even start.

So we converted the model. Forty-three megabytes. One second a photo. The same
answers, agreeing to seven decimal places.

---

_(Open the camera again. Point it at a person's face. Capture.)_

One last thing.

Early on, we pointed this scanner at a photograph of a person.

It said: rice. Healthy. Seventy-eight percent confident.

Every model like this is forced to answer something.

So we taught ours to refuse.

**— the screen now says "That does not look like a crop". Say nothing for two
seconds. —**

---

_(The app's home screen, or the logo.)_

A farmer forgives an app that says "I'm not sure".

He never opens one again after it was confidently wrong.

Agronavis. The data was always there.

---

## How to Read It

**Slow down more than feels natural.** Everyone speeds up on a recording. If it
feels slightly too slow while you are saying it, it is about right on playback.

**The four pauses that matter.** After "without any data". After "It's missing
delivery." The four seconds of Sahayak's voice. And the two seconds of silence
while the refusal sits on screen. These are where the film lands — do not fill
them.

**Three lines to hit hard:**

- "And he makes all four without any data." — the problem
- "It couldn't even start." — the engineering
- "So we taught ours to refuse." — the one nobody else can say

**Don't sound embarrassed about the face story.** Say it the way an engineer
reports a measurement. It is the strongest thing in the script, not an apology.

**Record the screen first, silently. Narrate afterwards.** Tapping and talking at
the same time gives you a bad take and a bad tap. Then line the voice up to the
footage in editing and trim any dead air.

**Record the narration in one continuous pass** if you can. Sentences recorded
minutes apart sound spliced, however carefully you cut them.

---

## Before You Record

- **Wake the server first.** It sleeps after 15 minutes idle, and the first
  request then takes about ten seconds. Open the app, load a screen, wait for it
  to answer — then start recording. Otherwise you get a ten-second dead spot in
  the middle of the demo.
- **Use build 1.2.0 or newer.** The face-refusal moment only works on it. Older
  builds will call your face healthy rice.
- **Find a real diseased leaf.** A healthy one gives a dull result card.
- Open every screen once beforehand so nothing loads on camera.
- Do Not Disturb on, brightness up, battery full.
- Clear old searches and filters from testing.
- Captions in the final edit. Judges often watch muted the first time.

---

## Cutting It to Three Minutes

Hard cap of 3:00? Cut these three, in this order. They come to about 70 words,
which is the 25 seconds you need, and none of them is load-bearing.

**1. Drop the mandi price section entirely** _(−17 words)_

> ~~Today's price for his state. The range it moved in, and the mandis that
> reported it.~~

It is the weakest moment in the film. The screen can show the mandi tab for two
seconds while you move on.

**2. Tighten the opening of the field section** _(−22 words)_

> So Agronavis starts with one action. He draws his field on the map. ~~That's
> the whole setup. And from here, everything is about that field. Not his
> district. Not his village. That field.~~ → **Everything after this is about
> that field. Not his district. That field.**

**3. Trim the soil explanation** _(−30 words)_

> His soil. Nitrogen low. Phosphorus high. ~~That isn't an estimate. Those are
> the government's own laboratory results for his district — and we show how
> many samples they're based on, so he can judge how much to trust them.~~ →
> **Not an estimate — the government's own laboratory results, and we show how
> many samples they're based on.**

**Do not cut** the face-refusal section, the two pauses, or "It couldn't even
start." Those are the three things a judge will still remember an hour later.

---

## The One-Minute Version

If you are capped at sixty seconds, this is what survives.

An Indian farmer decides four things every season. His soil, his water, his
pests, his price. He guesses at all four.

Yet the government already tested his soil. NASA already measured his rain. It's
all public — it just never reaches him.

_(drawing the field)_ Agronavis starts with one action. He draws his field.

_(soil, weather, price)_ Now his soil is the real laboratory result. His
irrigation comes from the UN's water equation. His price is today's, from his
own state.

_(scanning a leaf)_ A spot on a leaf — one photograph, one second.

_(scanning a face)_ We pointed it at a person once. It said healthy rice,
seventy-eight percent confident. So we taught it to refuse.

Agronavis. The data was always there.

---

## If You Need a Different Opening

Same length, different room.

**For a technical panel**

> Every image classifier has the same flaw. Show it something outside its
> training data and it answers anyway, confidently. We showed ours a photograph
> of a person and it said healthy rice, seventy-eight percent. This is what we
> built around that problem.

**For a government or cooperative audience**

> India tests the soil in over seven hundred districts and publishes every
> result. NASA measures the rainfall on every field in the country, for free.
> The data is excellent, and it's already paid for. It just never reaches the
> farm. That is the only problem Agronavis solves.

**For investors**

> Agricultural apps have one of two problems. Either the AI costs more per user
> than the user is worth, or it needs a signal the farmer doesn't have. We put
> the model on the phone. It costs us nothing per question, and it works in a
> field with no bars.
