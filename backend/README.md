---
title: Stegnokit API
emoji: 🔐
colorFrom: blue
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
short_description: Encrypted steganography for images and audio.
---

FastAPI backend for [Stegnokit](https://stegnokit.netlify.app). Hides AES-256-GCM-encrypted text in images (TrustMark CNN watermark + Reed-Solomon ECC + tiled capacity) and audio (band-limited spread-spectrum). Survives format conversion, re-compression, and screenshots.

Interactive API docs at `/docs`.
