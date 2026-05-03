// Constants here mirror the backend (app/codec.py, app/image/tiling.py,
// app/image/watermark.py). They must stay in sync.
import type { AudioFormat, GridName, ImageFormat } from "./api";

const TRUSTMARK_BITS = 100;
const ECC_NSYM = 20;
const HDR_FIXED = 20; // salt + nonce
const TAG_LEN = 16;
const LEN_HEADER_BYTES = 16;
const RS_BLOCK = 255;

const IMAGE_GRIDS: Record<GridName, number> = {
  stealth: 1,
  standard: 2,
  capacity: 3,
  max: 4,
};

const GRID_ORDER: GridName[] = ["stealth", "standard", "capacity", "max"];
const CHIP_ORDER_DESC = [4096, 2048, 1024, 512]; // largest first → most robust

export function imageCapacityBytes(grid: GridName): number {
  const n = IMAGE_GRIDS[grid];
  return Math.floor((n * n * TRUSTMARK_BITS) / 8);
}

export function audioCapacityBytes(durationSec: number, sampleRate: number, chipSamples: number): number {
  if (durationSec <= 0 || sampleRate <= 0 || chipSamples <= 0) return 0;
  const totalSamples = Math.floor(durationSec * sampleRate);
  const bits = Math.floor(totalSamples / chipSamples);
  return Math.floor(bits / 8);
}

export function totalEmbedBytes(plaintextLen: number, nsym = ECC_NSYM): number {
  if (plaintextLen < 0) return 0;
  const framed = HDR_FIXED + plaintextLen + TAG_LEN;
  const chunkData = RS_BLOCK - nsym;
  const numChunks = Math.max(1, Math.ceil(framed / chunkData));
  const eccLen = framed + numChunks * nsym;
  return LEN_HEADER_BYTES + eccLen;
}

export function maxPlaintextBytes(carrierCapacityBytes: number, nsym = ECC_NSYM): number {
  if (carrierCapacityBytes <= 0) return 0;
  const available = carrierCapacityBytes - LEN_HEADER_BYTES;
  const chunkData = RS_BLOCK - nsym;
  if (available <= 0 || chunkData <= 0) return 0;
  let upper = Math.floor((available * chunkData) / (chunkData + nsym)) - HDR_FIXED - TAG_LEN;
  upper = Math.min(upper, available);
  while (upper > 0 && totalEmbedBytes(upper, nsym) > carrierCapacityBytes) upper--;
  return Math.max(0, upper);
}

export function resolveImageFormat(file: File | null): ImageFormat {
  if (!file) return "PNG";
  const t = (file.type || "").toLowerCase();
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (t.includes("jpeg") || ext === "jpg" || ext === "jpeg") return "JPEG";
  if (t.includes("png") || ext === "png") return "PNG";
  if (t.includes("webp") || ext === "webp") return "WEBP";
  if (t.includes("avif") || ext === "avif") return "AVIF";
  if (t.includes("bmp") || ext === "bmp") return "BMP";
  if (t.includes("tiff") || ext === "tif" || ext === "tiff") return "TIFF";
  return "PNG";
}

export function resolveAudioFormat(file: File | null): AudioFormat {
  if (!file) return "wav";
  const t = (file.type || "").toLowerCase();
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (t.includes("wav") || ext === "wav") return "wav";
  if (t.includes("flac") || ext === "flac") return "flac";
  if (t.includes("mpeg") || t.includes("mp3") || ext === "mp3") return "mp3";
  if (t.includes("ogg") || ext === "ogg") return "ogg";
  if (t.includes("mp4") || t.includes("m4a") || ext === "m4a") return "m4a";
  if (t.includes("aac") || ext === "aac") return "aac";
  return "wav";
}

export function resolveImageGrid(messageBytes: number): GridName {
  const needed = totalEmbedBytes(messageBytes);
  for (const g of GRID_ORDER) {
    if (needed <= imageCapacityBytes(g)) return g;
  }
  return "max";
}

export function resolveAudioChip(durationSec: number, sampleRate: number, messageBytes: number): number {
  if (durationSec <= 0 || sampleRate <= 0) return 1024;
  const needed = totalEmbedBytes(messageBytes);
  for (const chip of CHIP_ORDER_DESC) {
    if (audioCapacityBytes(durationSec, sampleRate, chip) >= needed) return chip;
  }
  return 512;
}

export function gridLabel(grid: GridName): string {
  return grid.charAt(0).toUpperCase() + grid.slice(1);
}
