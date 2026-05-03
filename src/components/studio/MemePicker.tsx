import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { memeToFile, memes, type Meme } from "../../lib/memes";

type Props = {
  open: boolean;
  onClose: () => void;
  onPick: (file: File) => void;
};

export function MemePicker({ open, onClose, onPick }: Props) {
  const [query, setQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return memes;
    return memes.filter((m) => m.name.toLowerCase().includes(q));
  }, [query]);

  async function handlePick(meme: Meme) {
    setLoadingId(meme.id);
    try {
      const file = await memeToFile(meme);
      onPick(file);
      onClose();
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          onClick={onClose}
        >
          <motion.div
            key="modal"
            initial={{ scale: 0.96, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 12 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="relative w-full max-w-5xl max-h-[88vh] flex flex-col rounded-3xl glass-strong border-gradient overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute inset-x-0 -top-px h-px bg-neon-line opacity-70" />

            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-white/10">
              <div>
                <div className="text-[10px] font-mono tracking-[0.22em] text-neon-ice/80">
                  CHOOSE A MEME
                </div>
                <div className="font-display text-xl text-white">
                  {filtered.length} of {memes.length} carriers
                </div>
              </div>

              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-2 w-72 max-w-full focus-within:border-neon-cyan/50 transition-colors">
                <Search className="size-4 text-white/50 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="search…"
                  className="flex-1 bg-transparent text-sm text-white/90 placeholder:text-white/30 outline-none"
                />
              </div>

              <button
                onClick={onClose}
                aria-label="Close"
                className="grid place-items-center size-9 rounded-full border border-white/10 bg-white/[0.04] text-white/70 hover:text-white hover:border-white/30 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((m) => (
                <motion.button
                  key={m.id}
                  type="button"
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handlePick(m)}
                  disabled={loadingId !== null}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-white/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-neon-cyan/60 disabled:opacity-50"
                >
                  <img
                    src={m.src}
                    alt={m.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    draggable={false}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 ring-1 ring-inset ring-white/0 group-hover:ring-neon-cyan/60 transition-[box-shadow,ring] rounded-xl group-hover:shadow-[0_0_40px_-10px_rgba(0,229,255,0.6)]"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-2.5 text-left">
                    <div className="font-display text-xs text-white truncate">{m.name}</div>
                  </div>
                  {loadingId === m.id && (
                    <div className="absolute inset-0 grid place-items-center bg-black/60 text-[10px] font-mono tracking-widest text-neon-ice">
                      LOADING…
                    </div>
                  )}
                </motion.button>
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 text-white/40 font-mono text-sm">
                  no memes match "{query}"
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
