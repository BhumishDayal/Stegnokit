import { motion } from "framer-motion";
import { ArrowRight, Lock, Play } from "lucide-react";
import { GlitchText } from "./ui/GlitchText";
import { ParticleField } from "./ui/ParticleField";
import { AnimatedOrbs } from "./ui/AnimatedOrbs";
import { ScanLine } from "./ui/ScanLine";
import { BinaryStream } from "./ui/BinaryStream";
import { MagneticButton } from "./ui/MagneticButton";
import { EncryptedText } from "./ui/EncryptedText";

const badges = ["AES-256-GCM", "REED-SOLOMON", "SCREENSHOT-PROOF", "ANY FORMAT", "ZERO-KNOWLEDGE"];

export function Hero() {
  return (
    <section className="relative min-h-[100svh] flex items-center justify-center pt-32 pb-24 px-6 overflow-hidden">
      <AnimatedOrbs />
      <BinaryStream columns={18} />
      <ParticleField density={90} />
      <ScanLine />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-9 rounded-full border border-white/10 bg-white/[0.04] backdrop-blur-md text-[11px] font-mono tracking-[0.18em] text-white/70"
        >
          <span className="relative flex size-1.5">
            <span className="absolute inset-0 rounded-full bg-neon-cyan animate-pulseDot" />
            <span className="relative size-1.5 rounded-full bg-neon-cyan" />
          </span>
          <span>v1.0 · CRYPTOGRAPHIC STEGANOGRAPHY</span>
        </motion.div>

        <div className="space-y-2">
          <GlitchText
            text="Hide messages"
            className="font-display text-5xl md:text-7xl lg:text-[5.4rem] font-semibold tracking-[-0.03em] leading-[1.02]"
          />
          <div className="font-display text-5xl md:text-7xl lg:text-[5.4rem] font-semibold tracking-[-0.03em] leading-[1.02]">
            <span className="text-gradient-neon italic">where no one</span>{" "}
            <GlitchText
              text="looks."
              className="font-display text-5xl md:text-7xl lg:text-[5.4rem] font-semibold tracking-[-0.03em] leading-[1.02]"
            />
          </div>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-9 text-lg md:text-xl text-white/55 max-w-2xl mx-auto leading-relaxed"
        >
          Encrypted payloads woven into pixels you'd never inspect. Survives compression, screenshots,
          and format conversion — invisible to the eye, recoverable at will.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.75 }}
          className="mt-11 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <MagneticButton variant="primary">
            <Play className="size-4" fill="currentColor" />
            Launch Studio
            <ArrowRight className="size-4" />
          </MagneticButton>
          <MagneticButton variant="ghost">
            <Lock className="size-4" />
            See how it works
          </MagneticButton>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 1 }}
          className="mt-20 flex flex-wrap justify-center gap-x-8 gap-y-3 text-[11px] font-mono tracking-[0.18em] text-white/40"
        >
          {badges.map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className="size-1 rounded-full bg-neon-cyan/70 shadow-[0_0_8px_rgba(0,229,255,0.7)]" />
              <EncryptedText text={s} duration={900 + i * 120} delay={1100 + i * 90} />
            </span>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.4 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-[10px] font-mono tracking-[0.3em] text-white/30"
      >
        <span>SCROLL</span>
        <span className="block h-10 w-px bg-gradient-to-b from-white/40 to-transparent" />
      </motion.div>
    </section>
  );
}
