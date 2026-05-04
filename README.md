# 🔐 Stegnokit

[![Live](https://img.shields.io/badge/⚡_live-stegnokit.netlify.app-00d4ff?style=for-the-badge&logo=netlify&logoColor=white)](https://stegnokit.netlify.app)
[![API](https://img.shields.io/badge/🤗_api-Hugging_Face-fcc72c?style=for-the-badge)](https://huggingface.co/spaces/Bhumish26/stegnokit-api)
[![Built with](https://img.shields.io/badge/built_with-Vite_·_FastAPI-a855f7?style=for-the-badge)](https://github.com/BhumishDayal/Stegnokit)

Hide encrypted text inside images and audio. The payload survives JPEG re-compression, format conversion, and screenshots — so you can send the carrier through any chat app and the recipient (with the password) can pull the message back out. ✨

<p align="center">
  <img src="https://image.thum.io/get/width/1200/noanimate/https://stegnokit.netlify.app/" alt="Stegnokit Studio" width="900" />
</p>

## 🛠️ How it actually works

Drop a carrier (a meme, a photo, a voice note), type a message and a password, hit **Encode**. The message is sealed with AES-256-GCM, wrapped in Reed-Solomon error correction, and embedded:

🖼️ **Images** use [TrustMark](https://github.com/adobe/trustmark) — a learned CNN watermarker from Adobe Research that puts bits into perceptually-stable regions of the image instead of LSBs (which is what gives it screenshot-survival). The carrier is tiled into an N×N grid and each tile carries its own 100-bit watermark, so capacity scales with the grid: 12 B at 1×1, ~200 B at 4×4 for a 1080p carrier.

🎵 **Audio** uses direct-sequence spread-spectrum. A pseudo-random ±1 chip sequence — keyed by the password — is band-pass filtered to 1.5–4.5 kHz (where MP3/AAC keep the most detail) and added to the carrier at low amplitude. About 43 bits/s at 44.1 kHz, so a 10-second voice note carries ~50 B of plaintext.

🥷 **No fingerprint.** The wire format has zero plaintext magic bytes. A wrong password fails the GCM auth tag, which is indistinguishable from "no payload here" — so a watermarked carrier doesn't identify itself as a Stegnokit file even to someone who knows the algorithm.

## 📦 Stack

| Layer | Tech | Hosted on |
|---|---|---|
| Frontend | Vite · React · TypeScript · Tailwind · Framer Motion | Netlify |
| Backend  | FastAPI · Python 3.11 · TrustMark · NumPy/SciPy DSP  | Hugging Face Spaces (Docker) |

```
src/                          frontend
  components/Studio.tsx       interactive workspace
  lib/api.ts                  backend client
  lib/auto.ts                 capacity math, mirrored from backend

backend/
  app/codec.py                framing + AES-GCM + ECC
  app/image/                  TrustMark wrapper + tiling
  app/audio/                  spread-spectrum DSP
  tests/                      29 unit tests
  Dockerfile                  HF Space build (pre-fetches model weights)

scripts/
  fetch-memes.mjs             one-time meme catalog import (imgflip)
  secret-scan.mjs             pre-deploy credential scanner
```

## 💻 Run it locally

Frontend:

```bash
npm install
cp .env.local.example .env.local        # VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

Backend (conda is recommended because of the ffmpeg + libsndfile binaries):

```bash
conda env create -f backend/environment.yml
conda activate stegnokit
cd backend
pip install -r requirements.txt          # ~2 GB — pulls torch + trustmark
python -m uvicorn app.main:app --reload --port 8000
```

If you only want to iterate on the crypto/codec/audio side without the ML stack:

```bash
pip install -r backend/requirements-dev.txt
cd backend && pytest
```

## 🚀 Deploying

The frontend auto-deploys to Netlify on every push to `main`. Build settings come from `netlify.toml` and security headers from `public/_headers`.

The backend lives in its own Hugging Face Space. To push an update, clone the Space once, then copy `backend/` contents over and push:

```bash
git clone https://huggingface.co/spaces/<you>/<space-name> .hf-deploy/space
cp -r backend/{app,Dockerfile,requirements.txt,README.md,.dockerignore} .hf-deploy/space/
cd .hf-deploy/space && git add -A && git commit -m "deploy" && git push
```

The Dockerfile pre-fetches the TrustMark model weights during build, so the first user request after deploy doesn't have to wait on a 200 MB download.

After the backend is up, set `VITE_API_BASE_URL` in Netlify's environment variables to the Space URL (`https://<you>-<space-name>.hf.space`) and trigger a rebuild.
