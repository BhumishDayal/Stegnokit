import { motion } from "framer-motion";
import { ImageIcon, Music, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";

type Carrier = "image" | "audio";

type Props = {
  carrier: Carrier;
  file: File | null;
  onFile: (f: File | null) => void;
  className?: string;
};

const ACCEPT: Record<Carrier, string> = {
  image: "image/png,image/jpeg,image/webp,image/avif,image/bmp,image/tiff",
  audio: "audio/wav,audio/x-wav,audio/flac,audio/mpeg,audio/mp4,audio/aac,audio/ogg",
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function Dropzone({ carrier, file, onFile, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hover, setHover] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setAudioDuration(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = useCallback(
    (f: File | null) => {
      if (!f) {
        onFile(null);
        return;
      }
      const okImage = carrier === "image" && f.type.startsWith("image/");
      const okAudio = carrier === "audio" && f.type.startsWith("audio/");
      if (!okImage && !okAudio) {
        // best-effort: still pass through if extension matches expected carrier
        const ext = f.name.split(".").pop()?.toLowerCase() || "";
        const imgExts = ["png", "jpg", "jpeg", "webp", "avif", "bmp", "tif", "tiff"];
        const audExts = ["wav", "flac", "mp3", "ogg", "m4a", "aac"];
        const matchByExt =
          (carrier === "image" && imgExts.includes(ext)) ||
          (carrier === "audio" && audExts.includes(ext));
        if (!matchByExt) {
          alert(`Please choose a ${carrier} file.`);
          return;
        }
      }
      onFile(f);
    },
    [carrier, onFile],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setHover(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    handleFile(f);
    e.target.value = ""; // allow re-picking the same file
  };

  const Icon = carrier === "image" ? ImageIcon : Music;

  if (!file) {
    return (
      <motion.label
        whileHover={{ scale: 1.005 }}
        onDragEnter={() => setHover(true)}
        onDragOver={(e) => {
          e.preventDefault();
          setHover(true);
        }}
        onDragLeave={() => setHover(false)}
        onDrop={onDrop}
        className={cn(
          "relative block aspect-[16/10] w-full overflow-hidden rounded-xl border bg-gradient-to-br from-ink-700 via-ink-800 to-ink-900 cursor-pointer transition-colors",
          hover ? "border-neon-cyan/60 ring-neon" : "border-white/10 hover:border-white/20",
          className,
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT[carrier]}
          className="sr-only"
          onChange={onPick}
        />
        <div aria-hidden className="absolute inset-0 bg-grid-fine bg-grid-fine opacity-30" />
        <motion.div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "conic-gradient(from 90deg at 50% 50%, rgba(0,229,255,0.22), rgba(168,85,247,0.16), rgba(255,43,214,0.2), rgba(0,229,255,0.22))",
            filter: "blur(40px)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 24, ease: "linear", repeat: Infinity }}
        />
        <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
          <div className="grid place-items-center size-12 rounded-2xl border border-white/10 bg-white/[0.05] mb-3">
            <Icon className="size-5 text-neon-ice" />
          </div>
          <div className="text-[10px] font-mono tracking-[0.3em] text-white/55 mb-1">
            DROP {carrier.toUpperCase()} HERE
          </div>
          <div className="font-display text-xl text-white/85">
            or <span className="text-gradient-neon">click to browse</span>
          </div>
          <div className="mt-3 text-[10px] font-mono text-white/40">
            {carrier === "image"
              ? "PNG · JPEG · WEBP · AVIF · BMP · TIFF"
              : "WAV · FLAC · MP3 · OGG · M4A"}
          </div>
        </div>
      </motion.label>
    );
  }

  return (
    <div className={cn("relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/10 bg-black", className)}>
      {carrier === "image" && previewUrl && (
        <img src={previewUrl} alt="" className="absolute inset-0 w-full h-full object-contain" />
      )}
      {carrier === "audio" && previewUrl && (
        <div className="relative h-full w-full flex flex-col">
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "conic-gradient(from 0deg at 50% 50%, rgba(0,229,255,0.18), rgba(168,85,247,0.14), rgba(255,43,214,0.16), rgba(0,229,255,0.18))",
              filter: "blur(50px)",
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 30, ease: "linear", repeat: Infinity }}
          />
          <div className="relative z-10 flex-1 flex items-center justify-center">
            <Music className="size-12 text-neon-ice/60 animate-pulseDot" />
          </div>
          <div className="relative z-10 px-4 pb-4">
            <audio
              ref={audioRef}
              src={previewUrl}
              controls
              className="w-full"
              onLoadedMetadata={(e) => setAudioDuration((e.target as HTMLAudioElement).duration)}
            />
          </div>
        </div>
      )}

      <div className="absolute top-2 left-2 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1 text-[10px] font-mono tracking-widest text-white/80">
        <Upload className="size-3" />
        {file.name.length > 30 ? file.name.slice(0, 27) + "…" : file.name}
        <span className="text-white/40">·</span>
        <span className="text-white/60">{formatBytes(file.size)}</span>
        {audioDuration !== null && (
          <>
            <span className="text-white/40">·</span>
            <span className="text-white/60">{audioDuration.toFixed(1)}s</span>
          </>
        )}
      </div>

      <button
        onClick={() => onFile(null)}
        aria-label="Remove file"
        className="absolute top-2 right-2 grid place-items-center size-7 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white/70 hover:text-white hover:bg-red-500/20 hover:border-red-400/40 transition-colors"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
