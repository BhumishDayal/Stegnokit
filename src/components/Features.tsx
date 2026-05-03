import { ShieldCheck, Camera, FileCode2, Layers, KeyRound, Sparkles } from "lucide-react";
import { GlassCard } from "./ui/GlassCard";
import { RevealOnScroll } from "./ui/RevealOnScroll";
import { motion } from "framer-motion";
import { ReactNode } from "react";

type Feature = {
  icon: ReactNode;
  title: string;
  body: string;
  glow: "cyan" | "violet" | "magenta";
  span?: string;
  accent?: ReactNode;
};

const features: Feature[] = [
  {
    icon: <Camera className="size-5" />,
    title: "Screenshot-proof",
    body: "Payloads survive re-rasterization, compression chains, and even photos of screens — the signal lives where pixels are most stable.",
    glow: "cyan",
    span: "md:col-span-2 md:row-span-2",
    accent: (
      <div className="absolute -right-12 -bottom-12 size-72 rounded-full bg-neon-cyan/15 blur-3xl pointer-events-none" />
    ),
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: "AES-256-GCM",
    body: "Authenticated encryption with length framing. Tampered carriers fail loudly — never silently.",
    glow: "violet",
  },
  {
    icon: <FileCode2 className="size-5" />,
    title: "Format-agnostic",
    body: "PNG, JPEG, WebP, AVIF, BMP, TIFF. Encode in one, decode from another.",
    glow: "magenta",
  },
  {
    icon: <Layers className="size-5" />,
    title: "Reed-Solomon ECC",
    body: "Tunable redundancy recovers payloads even after ~30% of bits are corrupted by re-encoding.",
    glow: "cyan",
  },
  {
    icon: <KeyRound className="size-5" />,
    title: "Keyed PRNG placement",
    body: "Spread-spectrum embedding diffuses edits across the carrier — invisible to statistical detection.",
    glow: "violet",
  },
  {
    icon: <Sparkles className="size-5" />,
    title: "PSNR / SSIM verified",
    body: "Every encode reports perceptual quality so you know the carrier looks identical to the human eye.",
    glow: "magenta",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-mono tracking-[0.22em] text-neon-ice/80">
            <span className="size-1 rounded-full bg-neon-ice" />
            CAPABILITIES
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-[-0.02em] text-gradient max-w-3xl mx-auto leading-[1.05]">
            Built for the way{" "}
            <span className="text-gradient-neon italic">images travel</span> today.
          </h2>
          <p className="mt-6 text-white/55 max-w-2xl mx-auto leading-relaxed">
            Modern messaging apps re-encode, resize, and screenshot images at every hop. Stegnokit
            embeds where it matters — so your payload arrives intact, regardless of the route.
          </p>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 auto-rows-[14rem] gap-5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8% 0px" }}
              transition={{ duration: 0.7, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className={f.span}
            >
              <GlassCard glow={f.glow} className="h-full p-7 flex flex-col justify-between">
                {f.accent}
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center size-10 rounded-xl border border-white/10 bg-white/[0.05] text-neon-ice">
                    {f.icon}
                  </div>
                  <span className="text-[10px] font-mono tracking-[0.22em] text-white/40">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <div>
                  <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-white">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm text-white/55 leading-relaxed">{f.body}</p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
