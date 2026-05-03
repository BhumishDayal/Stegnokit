import { motion } from "framer-motion";
import { ImageUp, Cpu, Send } from "lucide-react";
import { RevealOnScroll } from "./ui/RevealOnScroll";

const steps = [
  {
    n: "01",
    icon: <ImageUp className="size-6" />,
    title: "Choose a carrier",
    body: "Drop in any image — your photo, a meme, a GIF frame. Anything pixels.",
  },
  {
    n: "02",
    icon: <Cpu className="size-6" />,
    title: "Encrypt & weave",
    body: "Your message is sealed with AES-256-GCM, shaped through ECC, and woven into the carrier in milliseconds.",
  },
  {
    n: "03",
    icon: <Send className="size-6" />,
    title: "Share anywhere",
    body: "Post, message, screenshot, re-share. The image reads exactly how it looks. Only the right key reveals the payload.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <RevealOnScroll className="text-center mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full border border-white/10 bg-white/[0.04] text-[10px] font-mono tracking-[0.22em] text-neon-violet/90">
            <span className="size-1 rounded-full bg-neon-violet" />
            FLOW
          </div>
          <h2 className="font-display text-4xl md:text-6xl font-semibold tracking-[-0.02em] text-gradient max-w-3xl mx-auto leading-[1.05]">
            Three steps. <span className="text-gradient-neon italic">Zero trace.</span>
          </h2>
        </RevealOnScroll>

        <div className="relative grid md:grid-cols-3 gap-6">
          <svg
            aria-hidden
            className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px"
            viewBox="0 0 100 1"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="path-gradient" x1="0" x2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#7df9ff" stopOpacity="0" />
                <stop offset="0.5" stopColor="#a855f7" />
                <stop offset="1" stopColor="#ff2bd6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <motion.line
              x1="0"
              y1="0.5"
              x2="100"
              y2="0.5"
              stroke="url(#path-gradient)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: "-30% 0px" }}
              transition={{ duration: 1.6, ease: "easeInOut" }}
            />
          </svg>

          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12% 0px" }}
              transition={{ duration: 0.8, delay: i * 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              <div className="relative grid place-items-center size-24 mx-auto rounded-2xl glass border-gradient">
                <div className="absolute inset-2 rounded-xl bg-gradient-to-br from-white/[0.04] to-transparent" />
                <div className="relative z-10 text-neon-ice">{s.icon}</div>
                <span className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-ink-900 border border-white/10 text-[10px] font-mono tracking-widest text-white/60">
                  {s.n}
                </span>
              </div>
              <div className="mt-7 text-center">
                <h3 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-white/55 max-w-xs mx-auto leading-relaxed">
                  {s.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
