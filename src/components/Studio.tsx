import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Image as ImageIcon,
  ImagePlus,
  KeyRound,
  Loader2,
  Lock,
  Music,
  RotateCcw,
  Sparkles,
  Unlock,
  Wand2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as api from "../lib/api";
import * as auto from "../lib/auto";
import { PICK_EVENT } from "../lib/memes";
import { cn } from "../lib/utils";
import { RevealOnScroll } from "./ui/RevealOnScroll";
import { Dropzone } from "./studio/Dropzone";
import { MemePicker } from "./studio/MemePicker";

type Carrier = "image" | "audio";
type Mode = "encode" | "decode";
type Auto = "auto";

const IMAGE_FORMATS: api.ImageFormat[] = ["PNG", "JPEG", "WEBP", "AVIF", "BMP", "TIFF"];
const AUDIO_FORMATS: api.AudioFormat[] = ["wav", "flac", "mp3", "ogg", "m4a"];

const GRID_OPTIONS: { value: api.GridName; label: string; hint: string }[] = [
  { value: "stealth", label: "Stealth", hint: "1 tile · ~12 B" },
  { value: "standard", label: "Standard", hint: "4 tiles · ~50 B" },
  { value: "capacity", label: "Capacity", hint: "9 tiles · ~110 B" },
  { value: "max", label: "Max", hint: "16 tiles · ~200 B" },
];

const CHIP_OPTIONS = [512, 1024, 2048, 4096];

type ResultState =
  | { kind: "image-encode"; data: api.ImageEncodeResult }
  | { kind: "image-decode"; data: api.ImageDecodeResult }
  | { kind: "audio-encode"; data: api.AudioEncodeResult }
  | { kind: "audio-decode"; data: api.AudioDecodeResult };

export function Studio() {
  const [carrier, setCarrier] = useState<Carrier>("image");
  const [mode, setMode] = useState<Mode>("encode");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [imageFormat, setImageFormat] = useState<api.ImageFormat | Auto>("auto");
  const [audioFormat, setAudioFormat] = useState<api.AudioFormat | Auto>("auto");
  const [grid, setGrid] = useState<api.GridName | Auto>("auto");
  const [chipChoice, setChipChoice] = useState<number | Auto>("auto");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultState | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [audioSampleRate, setAudioSampleRate] = useState<number>(44100);
  const [maxPlaintext, setMaxPlaintext] = useState<number | null>(null);

  useEffect(() => {
    setFile(null);
    setResult(null);
    setError(null);
    setAudioDuration(null);
  }, [carrier]);

  useEffect(() => {
    setResult(null);
    setError(null);
  }, [mode]);

  useEffect(() => {
    const onPick = (e: Event) => {
      const file = (e as CustomEvent<File>).detail;
      if (!file) return;
      setCarrier("image");
      setMode("encode");
      setFile(file);
      setError(null);
      setResult(null);
    };
    window.addEventListener(PICK_EVENT, onPick);
    return () => window.removeEventListener(PICK_EVENT, onPick);
  }, []);

  useEffect(() => {
    if (carrier !== "audio" || !file) return;
    const url = URL.createObjectURL(file);
    const audio = new Audio(url);
    const onMeta = () => {
      setAudioDuration(audio.duration);
    };
    audio.addEventListener("loadedmetadata", onMeta);
    decodeAudioSampleRate(file).then((sr) => sr && setAudioSampleRate(sr));
    return () => {
      audio.removeEventListener("loadedmetadata", onMeta);
      URL.revokeObjectURL(url);
    };
  }, [carrier, file]);

  const messageBytes = useMemo(() => new TextEncoder().encode(message).length, [message]);

  const resolvedImageFormat: api.ImageFormat =
    imageFormat === "auto" ? auto.resolveImageFormat(file) : imageFormat;
  const resolvedAudioFormat: api.AudioFormat =
    audioFormat === "auto" ? auto.resolveAudioFormat(file) : audioFormat;
  const resolvedGrid: api.GridName =
    grid === "auto" ? auto.resolveImageGrid(messageBytes) : grid;
  const resolvedChip: number =
    chipChoice === "auto"
      ? auto.resolveAudioChip(audioDuration ?? 0, audioSampleRate, messageBytes)
      : chipChoice;

  useEffect(() => {
    if (carrier === "image") {
      setMaxPlaintext(auto.maxPlaintextBytes(auto.imageCapacityBytes(resolvedGrid)));
    } else if (audioDuration && audioDuration > 0) {
      setMaxPlaintext(
        auto.maxPlaintextBytes(auto.audioCapacityBytes(audioDuration, audioSampleRate, resolvedChip)),
      );
    } else {
      setMaxPlaintext(null);
    }
  }, [carrier, resolvedGrid, resolvedChip, audioDuration, audioSampleRate]);

  const overCapacity = mode === "encode" && maxPlaintext !== null && messageBytes > maxPlaintext;
  const ready =
    !!file &&
    !!password &&
    (mode === "decode" || (message.length > 0 && !overCapacity)) &&
    !busy;

  async function onAction() {
    if (!file || !password) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      if (carrier === "image" && mode === "encode") {
        const data = await api.encodeImage({
          file,
          message,
          password,
          format: resolvedImageFormat,
          grid: resolvedGrid,
        });
        setResult({ kind: "image-encode", data });
      } else if (carrier === "image" && mode === "decode") {
        // On decode, "auto" is sent as-is so the backend can try every grid.
        const data = await api.decodeImage(file, password, grid);
        setResult({ kind: "image-decode", data });
      } else if (carrier === "audio" && mode === "encode") {
        const data = await api.encodeAudio({
          file,
          message,
          password,
          format: resolvedAudioFormat,
          chipSamples: resolvedChip,
          alpha: 0.012,
        });
        setResult({ kind: "audio-encode", data });
      } else if (carrier === "audio" && mode === "decode") {
        // chipSamples=0 tells the backend to try every chip size.
        const chipForDecode = chipChoice === "auto" ? 0 : chipChoice;
        const data = await api.decodeAudio(file, password, chipForDecode);
        setResult({ kind: "audio-decode", data });
      }
    } catch (err) {
      const msg = err instanceof api.ApiError ? err.detail : err instanceof Error ? err.message : "request failed";
      setError(msg);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setFile(null);
    setMessage("");
    setPassword("");
    setResult(null);
    setError(null);
  }

  return (
    <section id="studio" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-mono tracking-[0.22em] text-neon-magenta/90">
            <span className="size-1 rounded-full bg-neon-magenta" />
            STUDIO
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-[-0.02em] text-gradient max-w-3xl mx-auto leading-[1.05]">
            A workspace built for{" "}
            <span className="text-gradient-neon italic">silent signals.</span>
          </h2>
        </RevealOnScroll>

        <RevealOnScroll>
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 mb-4">
            <SegmentedToggle
              value={carrier}
              onChange={(v) => setCarrier(v)}
              options={[
                { value: "image", label: "Image", icon: <ImageIcon className="size-3.5" /> },
                { value: "audio", label: "Audio", icon: <Music className="size-3.5" /> },
              ]}
            />
            <SegmentedToggle
              value={mode}
              onChange={(v) => setMode(v)}
              options={[
                { value: "encode", label: "Encode", icon: <Lock className="size-3.5" /> },
                { value: "decode", label: "Decode", icon: <Unlock className="size-3.5" /> },
              ]}
            />
          </div>

          <motion.div
            whileHover={{ scale: 1.002 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="relative rounded-3xl glass-strong border-gradient overflow-hidden"
          >
            <div className="absolute inset-x-0 -top-px h-px bg-neon-line opacity-70" />
            <div className="absolute -inset-32 bg-gradient-to-tr from-neon-cyan/10 via-transparent to-neon-violet/10 blur-3xl pointer-events-none" />

            <div className="relative flex items-center justify-between px-5 py-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-red-400/70" />
                <span className="size-2.5 rounded-full bg-yellow-400/70" />
                <span className="size-2.5 rounded-full bg-green-400/70" />
              </div>
              <div className="text-[11px] font-mono tracking-[0.18em] text-white/40">
                stegnokit · studio
              </div>
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-white/45">
                {busy ? (
                  <>
                    <Loader2 className="size-3 animate-spin" />
                    {mode === "encode" ? "EMBEDDING" : "EXTRACTING"}
                  </>
                ) : (
                  <>
                    <span className="size-1.5 rounded-full bg-neon-cyan animate-pulse" />
                    READY
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
              {/* LEFT: carrier */}
              <div className="relative p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-[10px] font-mono tracking-[0.22em] text-white/40">
                    CARRIER
                  </div>
                  {carrier === "image" && (
                    <button
                      type="button"
                      onClick={() => setPickerOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-mono tracking-[0.18em] text-white/65 hover:text-neon-ice hover:border-neon-cyan/40 hover:bg-neon-cyan/[0.06] transition-colors"
                    >
                      <ImagePlus className="size-3" />
                      BROWSE MEMES
                    </button>
                  )}
                </div>
                <Dropzone carrier={carrier} file={file} onFile={setFile} />

                {mode === "encode" && (
                  <div className="mt-5">
                    <div className="text-[10px] font-mono tracking-[0.22em] text-white/40 mb-2">
                      OUTPUT FORMAT
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <AutoChip
                        selected={(carrier === "image" ? imageFormat : audioFormat) === "auto"}
                        resolved={
                          file
                            ? carrier === "image"
                              ? resolvedImageFormat
                              : resolvedAudioFormat.toUpperCase()
                            : null
                        }
                        onClick={() => {
                          if (carrier === "image") setImageFormat("auto");
                          else setAudioFormat("auto");
                        }}
                      />
                      {(carrier === "image" ? IMAGE_FORMATS : AUDIO_FORMATS).map((f) => {
                        const selected =
                          carrier === "image" ? f === imageFormat : f === audioFormat;
                        return (
                          <motion.button
                            key={f}
                            type="button"
                            whileHover={{ y: -2 }}
                            onClick={() => {
                              if (carrier === "image") setImageFormat(f as api.ImageFormat);
                              else setAudioFormat(f as api.AudioFormat);
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-[10px] font-mono tracking-[0.18em] border transition-colors",
                              selected
                                ? "border-neon-cyan/60 text-neon-ice bg-neon-cyan/[0.08] shadow-[0_0_20px_-6px_rgba(0,229,255,0.5)]"
                                : "border-white/10 text-white/55 hover:border-white/25 hover:text-white/85",
                            )}
                          >
                            {String(f).toUpperCase()}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Grid / chip controls */}
                <div className="mt-5">
                  <div className="text-[10px] font-mono tracking-[0.22em] text-white/40 mb-2">
                    {carrier === "image" ? "TILING / CAPACITY" : "CHIP SAMPLES"}
                  </div>
                  {carrier === "image" ? (
                    <div className="grid grid-cols-5 gap-2">
                      <AutoCard
                        selected={grid === "auto"}
                        resolved={mode === "encode" ? auto.gridLabel(resolvedGrid) : null}
                        hint={mode === "decode" ? "tries all" : "smallest fit"}
                        onClick={() => setGrid("auto")}
                      />
                      {GRID_OPTIONS.map((g) => (
                        <button
                          key={g.value}
                          type="button"
                          onClick={() => setGrid(g.value)}
                          className={cn(
                            "px-3 py-2.5 rounded-lg text-left border transition-colors",
                            g.value === grid
                              ? "border-neon-violet/60 bg-neon-violet/[0.08]"
                              : "border-white/10 hover:border-white/25",
                          )}
                        >
                          <div className="text-[11px] font-medium text-white">{g.label}</div>
                          <div className="text-[9px] font-mono tracking-wider text-white/50 mt-0.5">
                            {g.hint}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <AutoChip
                        selected={chipChoice === "auto"}
                        resolved={
                          mode === "encode" && file && audioDuration
                            ? String(resolvedChip)
                            : mode === "decode"
                            ? "tries all"
                            : null
                        }
                        onClick={() => setChipChoice("auto")}
                      />
                      {CHIP_OPTIONS.map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setChipChoice(n)}
                          className={cn(
                            "px-4 py-2 rounded-full text-[11px] font-mono tracking-widest border transition-colors",
                            n === chipChoice
                              ? "border-neon-violet/60 bg-neon-violet/[0.08] text-white"
                              : "border-white/10 text-white/60 hover:border-white/25",
                          )}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT: payload form / result */}
              <div className="p-6 lg:p-8 flex flex-col gap-4">
                {mode === "encode" ? (
                  <EncodeForm
                    message={message}
                    setMessage={setMessage}
                    password={password}
                    setPassword={setPassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    messageBytes={messageBytes}
                    maxPlaintext={maxPlaintext}
                    overCapacity={!!overCapacity}
                  />
                ) : (
                  <DecodeForm
                    password={password}
                    setPassword={setPassword}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                  />
                )}

                <ActionButton
                  ready={ready}
                  busy={busy}
                  mode={mode}
                  onAction={onAction}
                  onReset={reset}
                />

                <AnimatePresence mode="wait">
                  {error && <ErrorBanner key="err" message={error} />}
                  {result && <ResultPanel key="ok" result={result} />}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          <p className="mt-4 text-center text-[11px] font-mono tracking-widest text-white/35">
            BACKEND: {api.API_BASE.replace(/^https?:\/\//, "")}
          </p>
        </RevealOnScroll>
      </div>

      <MemePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(f) => {
          setCarrier("image");
          setMode("encode");
          setFile(f);
          setError(null);
          setResult(null);
        }}
      />
    </section>
  );
}

// ---------- subcomponents ----------

function AutoChip({
  selected,
  resolved,
  onClick,
}: {
  selected: boolean;
  resolved: string | null;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono tracking-[0.18em] border transition-colors",
        selected
          ? "border-neon-violet/60 text-white bg-neon-violet/[0.1] shadow-[0_0_20px_-6px_rgba(168,85,247,0.55)]"
          : "border-white/10 text-white/55 hover:border-white/25 hover:text-white/85",
      )}
    >
      <Wand2 className="size-3" />
      AUTO
      {selected && resolved && (
        <span className="text-white/55">· {resolved.toUpperCase()}</span>
      )}
    </motion.button>
  );
}

function AutoCard({
  selected,
  resolved,
  hint,
  onClick,
}: {
  selected: boolean;
  resolved: string | null;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative px-3 py-2.5 rounded-lg text-left border transition-colors",
        selected
          ? "border-neon-violet/60 bg-neon-violet/[0.1] shadow-[0_0_20px_-6px_rgba(168,85,247,0.45)]"
          : "border-white/10 hover:border-white/25",
      )}
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-white">
        <Wand2 className="size-3 text-neon-violet" />
        Auto
      </div>
      <div className="text-[9px] font-mono tracking-wider text-white/50 mt-0.5">
        {selected && resolved ? `· ${resolved}` : hint}
      </div>
    </button>
  );
}

function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; icon?: React.ReactNode }[];
}) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-white/[0.025] p-1 backdrop-blur-md">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "relative inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium tracking-wide transition-colors",
              active ? "text-ink-950" : "text-white/65 hover:text-white",
            )}
          >
            {active && (
              <motion.span
                layoutId={`bg-${options.map((x) => x.value).join("-")}`}
                className="absolute inset-0 rounded-full bg-gradient-to-r from-neon-ice via-neon-cyan to-neon-violet shadow-[0_0_24px_-6px_rgba(0,229,255,0.55)]"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5">
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EncodeForm(props: {
  message: string;
  setMessage: (s: string) => void;
  password: string;
  setPassword: (s: string) => void;
  showPassword: boolean;
  setShowPassword: (b: boolean) => void;
  messageBytes: number;
  maxPlaintext: number | null;
  overCapacity: boolean;
}) {
  const fillPct =
    props.maxPlaintext && props.maxPlaintext > 0
      ? Math.min(100, (props.messageBytes / props.maxPlaintext) * 100)
      : 0;
  return (
    <>
      <div>
        <div className="flex items-center justify-between text-[10px] font-mono tracking-[0.22em] text-white/40 mb-2">
          <span>MESSAGE</span>
          <span className={cn(props.overCapacity && "text-red-400")}>
            {props.messageBytes} B{props.maxPlaintext !== null && ` / ${props.maxPlaintext} B`}
          </span>
        </div>
        <textarea
          value={props.message}
          onChange={(e) => props.setMessage(e.target.value)}
          placeholder="meet me where we don't speak about it"
          rows={3}
          maxLength={4000}
          className={cn(
            "w-full rounded-xl border bg-black/30 p-4 font-mono text-sm text-white/85 placeholder:text-white/25 outline-none transition-colors resize-none",
            props.overCapacity
              ? "border-red-400/60 focus:border-red-400"
              : "border-white/10 focus:border-neon-cyan/60",
          )}
        />
        <div className="mt-2 h-1 rounded-full bg-white/[0.04] overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              props.overCapacity
                ? "bg-red-400"
                : "bg-gradient-to-r from-neon-cyan to-neon-violet",
            )}
            animate={{ width: `${fillPct}%` }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
          />
        </div>
      </div>

      <PasswordField
        value={props.password}
        onChange={props.setPassword}
        show={props.showPassword}
        toggle={() => props.setShowPassword(!props.showPassword)}
      />
    </>
  );
}

function DecodeForm(props: {
  password: string;
  setPassword: (s: string) => void;
  showPassword: boolean;
  setShowPassword: (b: boolean) => void;
}) {
  return (
    <>
      <div className="text-sm text-white/55 leading-relaxed">
        Drop the carrier on the left, type the password that was used to encode it, and we'll
        recover the original message.
      </div>
      <PasswordField
        value={props.password}
        onChange={props.setPassword}
        show={props.showPassword}
        toggle={() => props.setShowPassword(!props.showPassword)}
      />
    </>
  );
}

function PasswordField({
  value,
  onChange,
  show,
  toggle,
}: {
  value: string;
  onChange: (s: string) => void;
  show: boolean;
  toggle: () => void;
}) {
  return (
    <div>
      <div className="text-[10px] font-mono tracking-[0.22em] text-white/40 mb-2">PASSWORD</div>
      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 focus-within:border-neon-violet/60 transition-colors">
        <KeyRound className="size-4 text-neon-violet shrink-0" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="something memorable, nothing guessable"
          maxLength={256}
          className="flex-1 bg-transparent py-3 font-mono text-sm text-white/85 placeholder:text-white/25 outline-none"
        />
        <button
          type="button"
          onClick={toggle}
          className="text-[10px] font-mono tracking-widest text-white/40 hover:text-white/70 px-2 py-1 rounded"
        >
          {show ? "HIDE" : "SHOW"}
        </button>
      </div>
    </div>
  );
}

function ActionButton(props: {
  ready: boolean;
  busy: boolean;
  mode: Mode;
  onAction: () => void;
  onReset: () => void;
}) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <motion.button
        whileHover={props.ready ? { scale: 1.02 } : undefined}
        whileTap={props.ready ? { scale: 0.98 } : undefined}
        disabled={!props.ready}
        onClick={props.onAction}
        className={cn(
          "group relative inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium overflow-hidden transition-all flex-1",
          props.ready
            ? "bg-gradient-to-r from-neon-ice via-neon-cyan to-neon-violet text-ink-950 shadow-[0_0_30px_-6px_rgba(0,229,255,0.5)] hover:shadow-[0_0_50px_-4px_rgba(168,85,247,0.65)]"
            : "bg-white/[0.05] text-white/35 cursor-not-allowed border border-white/10",
        )}
      >
        {props.busy ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            {props.mode === "encode" ? "Encoding…" : "Decoding…"}
          </>
        ) : props.mode === "encode" ? (
          <>
            <Sparkles className="size-4" />
            Encode
          </>
        ) : (
          <>
            <Unlock className="size-4" />
            Decode
          </>
        )}
      </motion.button>
      <button
        type="button"
        onClick={props.onReset}
        title="Reset"
        className="grid place-items-center size-11 rounded-full border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:border-white/25 transition-colors"
      >
        <RotateCcw className="size-4" />
      </button>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/[0.06] px-4 py-3"
    >
      <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
      <div className="text-sm text-red-200/95 leading-relaxed">{message}</div>
    </motion.div>
  );
}

function ResultPanel({ result }: { result: ResultState }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="rounded-xl border border-emerald-400/25 bg-emerald-400/[0.04] p-4 space-y-3"
    >
      <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] text-emerald-300/90">
        <CheckCircle2 className="size-3.5" />
        {result.kind.replace("-", " · ").toUpperCase()}
      </div>

      {result.kind === "image-encode" && (
        <ImageEncodeResultBody data={result.data} />
      )}
      {result.kind === "audio-encode" && (
        <AudioEncodeResultBody data={result.data} />
      )}
      {(result.kind === "image-decode" || result.kind === "audio-decode") && (
        <DecodeResultBody
          message={result.data.message}
          confidence={result.data.confidence}
          extra={result.kind === "audio-decode" ? `${result.data.bits_decoded} bits scanned` : `grid ${(result.data as api.ImageDecodeResult).grid}×${(result.data as api.ImageDecodeResult).grid}`}
        />
      )}
    </motion.div>
  );
}

function ImageEncodeResultBody({ data }: { data: api.ImageEncodeResult }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Metric label="PSNR" value={`${data.psnr.toFixed(1)} dB`} />
        <Metric label="SSIM" value={data.ssim.toFixed(4)} />
        <Metric label="EMBEDDED" value={`${data.bytesEmbedded} B`} />
      </div>
      <div className="aspect-video rounded-lg overflow-hidden border border-white/10 bg-black">
        <img src={data.url} alt="watermarked output" className="w-full h-full object-contain" />
      </div>
      <DownloadButton url={data.url} filename={data.filename} />
    </>
  );
}

function AudioEncodeResultBody({ data }: { data: api.AudioEncodeResult }) {
  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        <Metric label="SNR" value={`${data.snrDb.toFixed(1)} dB`} />
        <Metric label="BITS" value={String(data.bitsEmbedded)} />
        <Metric label="CHIP" value={String(data.chipSamples)} />
      </div>
      <audio src={data.url} controls className="w-full" />
      <DownloadButton url={data.url} filename={data.filename} />
    </>
  );
}

function DecodeResultBody({
  message,
  confidence,
  extra,
}: {
  message: string;
  confidence: number;
  extra: string;
}) {
  return (
    <>
      <div className="rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-sm text-white whitespace-pre-wrap break-words">
        {message || <span className="text-white/40 italic">[empty]</span>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Metric label="CONFIDENCE" value={confidence.toFixed(3)} />
        <Metric label="DETAIL" value={extra} />
      </div>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.025] p-3">
      <div className="text-[9px] font-mono tracking-[0.22em] text-white/40">{label}</div>
      <div className="font-display text-base text-gradient-neon truncate">{value}</div>
    </div>
  );
}

function DownloadButton({ url, filename }: { url: string; filename: string }) {
  return (
    <a
      href={url}
      download={filename}
      className="inline-flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-full border border-white/15 bg-white/[0.04] text-sm text-white/90 hover:border-white/30 hover:bg-white/[0.07] transition-colors"
    >
      <Download className="size-4" />
      Download {filename}
    </a>
  );
}

// ---------- helpers ----------

async function decodeAudioSampleRate(file: File): Promise<number | null> {
  try {
    const Ctx: typeof AudioContext | undefined =
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext ||
      (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const buf = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(buf.slice(0));
    const sr = decoded.sampleRate;
    ctx.close();
    return sr;
  } catch {
    return null;
  }
}
