import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { memes, pickMemeAsCarrier, type Meme } from "../lib/memes";
import { RevealOnScroll } from "./ui/RevealOnScroll";

function MemeTile({ meme }: { meme: Meme }) {
  return (
    <motion.button
      type="button"
      onClick={() => pickMemeAsCarrier(meme)}
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="group relative aspect-square w-44 md:w-52 flex-shrink-0 overflow-hidden rounded-2xl border border-white/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-neon-cyan/60"
      aria-label={`Use ${meme.name} as carrier`}
    >
      <img
        src={meme.src}
        alt={meme.name}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        draggable={false}
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity"
      />
      <div aria-hidden className="absolute inset-0 noise opacity-15 mix-blend-overlay" />
      <div
        aria-hidden
        className="absolute inset-0 ring-1 ring-inset ring-white/0 group-hover:ring-neon-cyan/50 transition-[box-shadow,ring] duration-300 rounded-2xl group-hover:shadow-[0_0_40px_-10px_rgba(0,229,255,0.5)]"
      />

      <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-md border border-white/10 text-[9px] font-mono tracking-[0.22em] text-white/80">
        MEME
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 text-left">
        <div className="font-display text-sm text-white truncate">{meme.name}</div>
        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-mono tracking-[0.2em] text-neon-ice opacity-0 group-hover:opacity-100 transition-opacity">
          <Sparkles className="size-3" />
          USE AS CARRIER
        </div>
      </div>
    </motion.button>
  );
}

export function MemeGallery() {
  // Two opposing marquees, each with the full set duplicated for a seamless loop.
  const half = Math.ceil(memes.length / 2);
  const rowA = memes.slice(0, half);
  const rowB = memes.slice(half);
  const loopA = [...rowA, ...rowA];
  const loopB = [...rowB, ...rowB];

  return (
    <section id="gallery" className="relative py-32">
      <div className="max-w-7xl mx-auto px-6">
        <RevealOnScroll className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-5 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-mono tracking-[0.22em] text-neon-ice/80">
              <span className="size-1 rounded-full bg-neon-ice" />
              GALLERY
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-[-0.02em] text-gradient leading-[1.05] max-w-2xl">
              Pre-loaded with the{" "}
              <span className="text-gradient-neon italic">internet's loudest</span> memes.
            </h2>
            <p className="mt-5 text-white/55 max-w-xl leading-relaxed">
              {memes.length} curated carriers, ready to ferry your encrypted payload through any DM,
              group chat, or feed. Click any meme to load it as your carrier.
            </p>
          </div>
        </RevealOnScroll>
      </div>

      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div className="flex gap-5 animate-marquee w-max py-4 px-6">
          {loopA.map((m, i) => (
            <MemeTile key={`a-${i}-${m.id}`} meme={m} />
          ))}
        </div>
      </div>

      <div className="relative overflow-hidden mt-5 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
        <div
          className="flex gap-5 animate-marquee w-max py-4 px-6"
          style={{ animationDirection: "reverse", animationDuration: "55s" }}
        >
          {loopB.map((m, i) => (
            <MemeTile key={`b-${i}-${m.id}`} meme={m} />
          ))}
        </div>
      </div>
    </section>
  );
}
