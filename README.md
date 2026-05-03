# Stegnokit

Hide encrypted text inside images and audio. The payload survives JPEG re-compression, format conversion, and screenshots, so you can send the carrier through any chat app and the recipient (who has the password) can pull the message back out.

Live demo: **[stegnokit.netlify.app](https://stegnokit.netlify.app)**

## How it actually works

Drop a carrier (a meme, a photo, a voice note), type a message and a password, hit Encode. The message gets sealed with AES-256-GCM, wrapped in Reed-Solomon error correction, then embedded:

**Images** use [TrustMark](https://github.com/adobe/trustmark) — a learned CNN watermarker from Adobe Research. It puts bits into perceptually-stable regions of the image instead of LSBs, which is what gives it screenshot-survival. The carrier is tiled into an N×N grid and each tile gets its own 100-bit watermark, so capacity scales with the grid (12 B at 1×1, ~200 B at 4×4 for a 1080p carrier).

**Audio** uses direct-sequence spread-spectrum. A pseudo-random ±1 chip sequence — keyed by the password — is band-pass filtered to 1.5–4.5 kHz (where MP3/AAC keep the most detail) and added to the carrier at low amplitude. About 43 bits/sec at 44.1 kHz, so a 10-second voice note carries ~50 B of plaintext.

The wire format has no plaintext magic bytes. A wrong password fails the GCM auth tag, which is indistinguishable from "no payload here" — so a watermarked carrier doesn't fingerprint as a Stegnokit file even to someone who knows the algorithm.

## What it can't do

- Capacity is small. ~100–250 bytes per 1080p image, less for short audio. Don't try to hide a PDF.
- Survives screenshots, format conversion, and mainstream chat-app re-encoding. Does *not* survive heavy crops, photos of screens at sharp angles, or downscales below ~480p.
- The HF Spaces free tier sleeps after ~48 hours of inactivity. First request after sleep takes ~15 s while the container wakes; warm encodes are 3–5 s on CPU.
- Animated GIFs aren't supported as carriers. TrustMark watermarks a still image and there's no clean way to keep the bits consistent across all frames after re-encoding.

## Stack

| Layer | Tech | Hosted on |
|---|---|---|
| Frontend | Vite · React · TypeScript · Tailwind · Framer Motion | Netlify |
| Backend | FastAPI · Python 3.11 · TrustMark · NumPy/SciPy DSP | Hugging Face Spaces (Docker) |

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

## Run it locally

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

## Deploying

The frontend auto-deploys to Netlify on every push to `main`. Build settings come from `netlify.toml` and security headers from `public/_headers`.

The backend lives in its own Hugging Face Space. To push an update, clone the Space once, then copy `backend/` contents over and push:

```bash
git clone https://huggingface.co/spaces/<you>/<space-name> .hf-deploy/space
cp -r backend/{app,Dockerfile,requirements.txt,README.md,.dockerignore} .hf-deploy/space/
cd .hf-deploy/space && git add -A && git commit -m "deploy" && git push
```

The Dockerfile pre-fetches the TrustMark model weights during build, so the first user request after deploy doesn't have to wait on a 200 MB download.

After the backend is up, set `VITE_API_BASE_URL` in Netlify's environment variables to the Space URL (`https://<you>-<space-name>.hf.space`) and trigger a rebuild.
