# Sahayak and the scanner: app setup

The server side (online models, the knowledge base, the disease model, keeping Render awake) lives in **Agronavis-AI/backend-pro**: see its `docs/AI_SETUP.md`. This page is what the app needs.

The app goes online first, then to the phone's model, then keeps the question for later:

```
question ─► online? ─yes─► backend-pro /api/v1/sahayak/chat (open models + KCC knowledge, with sources)
              no
              ▼
        offline model on phone? ─yes─► Gemma 3 1B answers on the handset
              no
              ▼
        saved; answered in the same chat when the network returns
```

| Setting | Default | What it does |
|---|---|---|
| `EXPO_PUBLIC_SAHAYAK_ONLINE` | on | `off` builds an app that only uses the phone's model |
| `EXPO_PUBLIC_OFFLINE_MODEL_URL` | this repo's `offline-model-v1` release | Where the offline model downloads from |
| `EXPO_PUBLIC_OFFLINE_MODEL_BYTES` | unset | The model's exact size; without it, the app records it from the download |

## Offline model (about 15 minutes, once)

Gemma 3 1B is behind a licence click-through on Hugging Face, so phones cannot download it from there. Host it as a release of this repo:

1. Sign in to Hugging Face and accept the licence on [litert-community/Gemma3-1B-IT](https://huggingface.co/litert-community/Gemma3-1B-IT).
2. Download `gemma3-1b-it-int4.litertlm`.
3. On GitHub, open **jpdevhub/Agronavis-App ▸ Releases ▸ Draft a new release**.
   - Tag: `offline-model-v1`.
   - Attach `gemma3-1b-it-int4.litertlm`.
   - Attach a text file named `NOTICE` that reads: `Gemma is provided under and subject to the Gemma Terms of Use found at ai.google.dev/gemma/terms`.
   - Attach a copy of the Gemma Terms of Use. Redistribution requires both files.
4. Publish. The app already points at `https://github.com/jpdevhub/Agronavis-App/releases/download/offline-model-v1/gemma3-1b-it-int4.litertlm`.
5. Optional: set `EXPO_PUBLIC_OFFLINE_MODEL_BYTES` to the exact file size, as shown by `ls -l`.

The download is offered on Wi-Fi only. Phones that already downloaded Gemma 4 E2B or E4B keep using it.

## Scanner

The camera now asks *which crop is this?* and sends the crop with the photo, so the server ranks only that crop's diseases. Photos are captured at about 1280×960 instead of full resolution, so they upload in seconds on 3G. This needs backend-pro with the crop-aware `/crops/diagnose`; an older server ignores the crop and still answers.

## Before release

- [ ] backend-pro deployed with its Sahayak keys and migration 0029 (its checklist)
- [ ] Release `offline-model-v1` here, with the model, `NOTICE` and the Gemma terms
- [ ] Play Console *Data safety*: Sahayak now sends app content (the question and farm details, not the farmer's name) to our server and to Groq and Cloudflare to provide the feature; not stored, not used for anything else
- [ ] Privacy policy page republished (`npm run legal` regenerates PRIVACY.md and TERMS.md)
- [ ] **A new Android build** (`eas build -p android`), not an over-the-air update: the native Gemma module changed
