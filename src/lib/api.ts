const RAW_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:8000";
export const API_BASE = RAW_BASE.replace(/\/+$/, "");

export type GridName = "stealth" | "standard" | "capacity" | "max";
export type ImageFormat = "PNG" | "JPEG" | "WEBP" | "AVIF" | "BMP" | "TIFF";
export type AudioFormat = "wav" | "flac" | "mp3" | "ogg" | "m4a" | "aac";

export class ApiError extends Error {
  constructor(public status: number, public detail: string) {
    super(detail);
    this.name = "ApiError";
  }
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `request failed (${res.status})` }));
    throw new ApiError(res.status, body.detail || `request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ---- Image ----

export type ImageEncodeInput = {
  file: File;
  message: string;
  password: string;
  format: ImageFormat;
  grid: GridName;
  quality?: number;
};

export type ImageEncodeResult = {
  blob: Blob;
  url: string;
  filename: string;
  psnr: number;
  ssim: number;
  grid: number;
  bytesEmbedded: number;
};

export async function encodeImage(input: ImageEncodeInput): Promise<ImageEncodeResult> {
  const fd = new FormData();
  fd.append("image", input.file);
  fd.append("message", input.message);
  fd.append("password", input.password);
  fd.append("output_format", input.format);
  fd.append("grid", input.grid);
  if (input.quality !== undefined) fd.append("output_quality", String(input.quality));

  const res = await fetch(`${API_BASE}/image/encode`, { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `request failed (${res.status})` }));
    throw new ApiError(res.status, body.detail || "encode failed");
  }
  const blob = await res.blob();
  return {
    blob,
    url: URL.createObjectURL(blob),
    filename: `stegnokit.${input.format.toLowerCase()}`,
    psnr: parseFloat(res.headers.get("X-Stegnokit-PSNR") || "0"),
    ssim: parseFloat(res.headers.get("X-Stegnokit-SSIM") || "0"),
    grid: parseInt(res.headers.get("X-Stegnokit-Grid") || "0", 10),
    bytesEmbedded: parseInt(res.headers.get("X-Stegnokit-Bytes") || "0", 10),
  };
}

export type ImageDecodeResult = {
  message: string;
  confidence: number;
  grid: number;
};

export async function decodeImage(
  file: File,
  password: string,
  grid: GridName | "auto",
): Promise<ImageDecodeResult> {
  const fd = new FormData();
  fd.append("image", file);
  fd.append("password", password);
  fd.append("grid", grid);
  const res = await fetch(`${API_BASE}/image/decode`, { method: "POST", body: fd });
  return jsonOrThrow<ImageDecodeResult>(res);
}

// ---- Audio ----

export type AudioEncodeInput = {
  file: File;
  message: string;
  password: string;
  format: AudioFormat;
  chipSamples: number;
  alpha: number;
};

export type AudioEncodeResult = {
  blob: Blob;
  url: string;
  filename: string;
  snrDb: number;
  bitsEmbedded: number;
  chipSamples: number;
};

export async function encodeAudio(input: AudioEncodeInput): Promise<AudioEncodeResult> {
  const fd = new FormData();
  fd.append("audio", input.file);
  fd.append("message", input.message);
  fd.append("password", input.password);
  fd.append("output_format", input.format);
  fd.append("chip_samples", String(input.chipSamples));
  fd.append("alpha", String(input.alpha));

  const res = await fetch(`${API_BASE}/audio/encode`, { method: "POST", body: fd });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: `request failed (${res.status})` }));
    throw new ApiError(res.status, body.detail || "encode failed");
  }
  const blob = await res.blob();
  return {
    blob,
    url: URL.createObjectURL(blob),
    filename: `stegnokit.${input.format.toLowerCase()}`,
    snrDb: parseFloat(res.headers.get("X-Stegnokit-SNR-dB") || "0"),
    bitsEmbedded: parseInt(res.headers.get("X-Stegnokit-Bits") || "0", 10),
    chipSamples: parseInt(res.headers.get("X-Stegnokit-ChipSamples") || `${input.chipSamples}`, 10),
  };
}

export type AudioDecodeResult = {
  message: string;
  confidence: number;
  bits_decoded: number;
};

/** Pass `chipSamples = 0` to ask the backend to try every chip size. */
export async function decodeAudio(
  file: File,
  password: string,
  chipSamples: number,
): Promise<AudioDecodeResult> {
  const fd = new FormData();
  fd.append("audio", file);
  fd.append("password", password);
  fd.append("chip_samples", String(chipSamples));
  const res = await fetch(`${API_BASE}/audio/decode`, { method: "POST", body: fd });
  return jsonOrThrow<AudioDecodeResult>(res);
}
