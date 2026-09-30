# Where the grafted modules came from

Four capability layers were adapted into Agronavis from two separate projects. Both
were checked out locally during the graft and have since been removed; this file is
the record of what came from where, since the imported code no longer says so.

| Source | Repository |
|---|---|
| React Native app | `https://github.com/krmanish1/krishi-sathi-ai` (at `67c6b9c`) |
| Python voice/AI service | `https://github.com/Nikesh2290/KrishiSaathi-AI` (at `c194f18`) |

## What was taken, and what was not

**Mandi engine** → `features/mandi/`. Rebuilt rather than copied: Krishi calls
data.gov.in straight from the client, which breaks the rule that every upstream call
goes through the backend. The catalogue now comes from Agmarknet via the API, keyed
on Agmarknet's own ids.

**Offline layer** → `shared/network/` and `shared/offline/`. Krishi keeps an SQLite
mirror; Agronavis queues mutations in AsyncStorage under
`agronavis_pending_mutations` and replays them on reconnect. SQLite would only earn
its place once there is a large on-device dataset to hold.

**On-device Gemma** → `modules/gemma-llm/` and `features/sahayak/`. Two ideas were
adopted deliberately: persisting the download checkpoint so a killed process
continues instead of restarting, and caching the farm context so the model still
knows the farm with no signal.

Krishi's planner/synthesizer split was **not** adopted. It asks the small model to
emit JSON naming a tool to call, which needs those tools to exist server-side and is
fragile at 2–4B parameters. Sahayak instead injects the farm's real records straight
into the prompt — fewer moving parts, and nothing to parse.

**LiveKit voice** was **not** adopted. Speech in and out already works through
`expo-speech` and `expo-speech-recognition` in `useSahayakVoice.ts`, including Hindi.
LiveKit would add streaming barge-in, but it needs credentials, four native
packages, and the Python agent service hosted somewhere — none of which fit the
current free-tier deployment. Revisit if interruptible conversation becomes a
requirement.
